# gestion_solicitudes/models/support_ticket.py
from odoo import fields, models, api
from odoo.exceptions import ValidationError
import os
import logging
import json

_logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    _logger.warning("OpenAI library not installed. Install with: pip install openai")
    OPENAI_AVAILABLE = False

class SupportTicket(models.Model):
    _name = 'support.ticket'
    _description = 'Modelo para la Gestión de Solicitudes/Tickets'
    _inherit = ['mail.thread', 'mail.activity.mixin'] # Para chatter y actividades
    
    # --- Campos del Modelo ---
    titulo = fields.Char(string='Título', required=True, tracking=True)
    descripcion = fields.Text(string='Descripción del Problema', required=True, tracking=True)
    
    estado = fields.Selection([
        ('nuevo', 'Nuevo'),
        ('en_progreso', 'En Progreso'),
        ('resuelto', 'Resuelto'),
        ('cancelado', 'Cancelado'),
    ], string='Estado', default='nuevo', required=True, tracking=True)
    
    prioridad = fields.Selection([
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
    ], string='Prioridad', required=True, tracking=True)

    asignatario_id = fields.Many2one('res.users', string='Asignatario', tracking=True)
    etiquetas_ids = fields.Many2many('support.ticket.tag', string='Etiquetas', tracking=True)
    
    # --- Relación con Auditoría ---
    audit_ids = fields.One2many('support.ticket.audit', 'ticket_id', string='Registros de Auditoría')
    
    # --- Campos relacionados con la IA ---
    prioridad_ia = fields.Selection(
        lambda self: self.env['support.ticket']._fields['prioridad'].selection, 
        string='Prioridad Sugerida (IA)', readonly=True
    )
    explicacion_ia = fields.Text(string='Explicación de la IA', readonly=True)
    origen_ia = fields.Selection([
        ('openai', 'OpenAI'),
        ('reglas', 'Reglas'),
        ('manual', 'Manual'),
    ], string='Origen de Clasificación', readonly=True)

    # --- Lógica de Creación y IA ---
    @api.model_create_multi
    def create(self, vals_list):
        """ Sobrescribe el método de creación para integrar la clasificación de la IA. """
        for vals in vals_list:
            # Si la prioridad no viene definida, clasificamos con la IA
            if 'prioridad' not in vals:
                titulo = vals.get('titulo', '')
                descripcion = vals.get('descripcion', '')
                ia_result = self._simular_clasificacion_ia(titulo, descripcion)
                vals.update({
                    'prioridad_ia': ia_result['prioridad'],
                    'prioridad': ia_result['prioridad'],
                    'explicacion_ia': ia_result['explicacion'],
                    'origen_ia': ia_result.get('origen', 'reglas'),
                })
            # Si viene prioridad pero no explicación IA, la generamos
            elif 'explicacion_ia' not in vals:
                titulo = vals.get('titulo', '')
                descripcion = vals.get('descripcion', '')
                ia_result = self._simular_clasificacion_ia(titulo, descripcion)
                vals.update({
                    'prioridad_ia': ia_result['prioridad'],
                    'explicacion_ia': ia_result['explicacion'],
                    'origen_ia': ia_result.get('origen', 'reglas'),
                })
        
        tickets = super().create(vals_list)
        
        # Crear registros de auditoría para creación de tickets
        for idx, ticket in enumerate(tickets):
            try:
                self._create_audit_log(ticket, 'create', {}, vals_list[idx] if idx < len(vals_list) else {})
            except Exception as e:
                _logger.warning(f"Error al crear auditoría para ticket {ticket.id}: {e}")
        
        return tickets
    
    def write(self, vals):
        """ Sobrescribe el método write para registrar cambios en auditoría. """
        # Campos a trackear en auditoría
        tracked_fields = ['estado', 'prioridad', 'asignatario_id', 'titulo', 'descripcion']
        
        # Guardar valores anteriores para todos los registros
        old_values_per_record = {}
        for record in self:
            old_values = {}
            for field in tracked_fields:
                if field in vals:
                    old_values[field] = getattr(record, field)
            old_values_per_record[record.id] = old_values
        
        # Ejecutar el write original
        result = super(SupportTicket, self).write(vals)
        
        # Crear registros de auditoría para cada campo modificado
        for record in self:
            old_values = old_values_per_record.get(record.id, {})
            for field in tracked_fields:
                if field in vals and field in old_values:
                    record._create_audit_log_for_field(record, field, old_values[field], vals[field])
        
        return result
    
    def _create_audit_log(self, ticket, change_type, old_vals, new_vals):
        """
        Crea un registro de auditoría para la creación del ticket.
        """
        user_id = self.env.user.id
        
        if change_type == 'create':
            self.env['support.ticket.audit'].sudo().create({
                'ticket_id': ticket.id,
                'field_name': 'ticket',
                'old_value': '',
                'new_value': ticket.titulo,
                'user_id': user_id,
                'change_type': 'create',
                'description': f'Ticket creado: {ticket.titulo}',
            })
    
    def _create_audit_log_for_field(self, ticket, field_name, old_value, new_value):
        """
        Crea un registro de auditoría para un campo específico modificado.
        """
        try:
            # Convertir valores para auditoría
            if isinstance(old_value, models.BaseModel):
                old_value = old_value.name if old_value else ''
            if isinstance(new_value, int) and field_name == 'asignatario_id':
                user = self.env['res.users'].sudo().browse(new_value)
                new_value = user.name if user else ''
            
            # Determinar tipo de cambio
            change_type = 'update'
            if field_name == 'estado':
                change_type = 'state_change'
            elif field_name == 'asignatario_id':
                change_type = 'assignment'
            
            description = self._get_audit_description(field_name, old_value, new_value)
            
            self.env['support.ticket.audit'].sudo().create({
                'ticket_id': ticket.id,
                'field_name': field_name,
                'old_value': str(old_value),
                'new_value': str(new_value),
                'user_id': self.env.user.id,
                'change_type': change_type,
                'description': description,
            })
        except Exception as e:
            _logger.error(f"Error al crear registro de auditoría para campo {field_name}: {e}")
    
    def _get_audit_description(self, field_name, old_value, new_value):
        """
        Genera una descripción legible para el registro de auditoría.
        """
        field_labels = {
            'estado': 'Estado',
            'prioridad': 'Prioridad',
            'asignatario_id': 'Asignatario',
            'titulo': 'Título',
            'descripcion': 'Descripción',
        }
        
        label = field_labels.get(field_name, field_name)
        return f'{label} cambiado de "{old_value}" a "{new_value}"'
    
    # --- Acciones de cambio de estado desde la vista ---
    def _action_set_estado(self, nuevo_estado):
        estados_validos = ['nuevo', 'en_progreso', 'resuelto', 'cancelado']
        if nuevo_estado not in estados_validos:
            raise ValidationError("Estado inválido para el ticket.")
        for record in self:
            if record.estado != nuevo_estado:
                record.write({'estado': nuevo_estado})
        return True

    def action_set_estado_nuevo(self):
        return self._action_set_estado('nuevo')

    def action_set_estado_en_progreso(self):
        return self._action_set_estado('en_progreso')

    def action_set_estado_resuelto(self):
        return self._action_set_estado('resuelto')

    def action_set_estado_cancelado(self):
        return self._action_set_estado('cancelado')
    
    def action_diagnostico_openai(self):
        """
        Diagnóstico de configuración de OpenAI desde Odoo.
        Muestra información detallada sobre la configuración.
        """
        diagnostico = []
        diagnostico.append("="*60)
        diagnostico.append("DIAGNÓSTICO OPENAI DESDE ODOO")
        diagnostico.append("="*60)
        
        # 1. Verificar librería
        diagnostico.append(f"1. OPENAI_AVAILABLE: {OPENAI_AVAILABLE}")
        if OPENAI_AVAILABLE:
            try:
                from openai import __version__
                diagnostico.append(f"   Versión openai: {__version__}")
            except:
                diagnostico.append(f"   Versión openai: No se pudo obtener")
        
        # 2. Verificar API Key
        api_key = os.environ.get('OPENAI_API_KEY')
        if api_key:
            diagnostico.append(f"2. API Key: SÍ (***{api_key[-4:]})")
            diagnostico.append(f"   Longitud: {len(api_key)} caracteres")
        else:
            diagnostico.append("2. API Key: NO ENCONTRADA")
            diagnostico.append("   Variable OPENAI_API_KEY no está en os.environ")
        
        # 3. Listar todas las variables de entorno (solo las que empiezan con OPENAI)
        diagnostico.append("3. Variables de entorno relacionadas:")
        for key in os.environ:
            if 'OPENAI' in key.upper():
                val = os.environ[key]
                diagnostico.append(f"   {key}: {val[:20]}..." if len(val) > 20 else f"   {key}: {val}")
        
        diagnostico.append("="*60)
        
        # Log completo
        for line in diagnostico:
            _logger.info(line)
        
        # Mensaje al usuario
        mensaje = "\n".join(diagnostico)
        
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Diagnóstico OpenAI',
                'message': f'Revisa los logs del servidor. API Key: {"ENCONTRADA" if api_key else "NO ENCONTRADA"}',
                'type': 'info' if api_key else 'warning',
                'sticky': True,
            }
        }
    
    def action_recalcular_prioridad_ia(self):
        """
        Recalcula la prioridad del ticket usando IA y sobrescribe la prioridad actual.
        Este método se puede invocar desde un botón en la vista.
        """
        _logger.info("="*60)
        _logger.info("⚙️ BOTÓN 🤖 Recalcular Prioridad con IA INVOCADO")
        _logger.info(f"Procesando {len(self)} registro(s)")
        
        for record in self:
            _logger.info(f"Ticket ID: {record.id} - '{record.titulo}'")
            
            if not record.titulo or not record.descripcion:
                _logger.error("Ticket sin título o descripción")
                raise ValidationError("El ticket debe tener título y descripción para recalcular la prioridad.")
            
            # Llamar a la IA para reclasificar
            _logger.info("Llamando a _simular_clasificacion_ia()...")
            ia_result = record._simular_clasificacion_ia(record.titulo, record.descripcion)
            
            _logger.info(f"Resultado IA: {ia_result}")
            
            # Actualizar todos los campos relacionados con IA y la prioridad
            record.write({
                'prioridad_ia': ia_result['prioridad'],
                'prioridad': ia_result['prioridad'],  # Sobrescribir prioridad actual
                'explicacion_ia': ia_result['explicacion'],
                'origen_ia': ia_result.get('origen', 'reglas'),
            })
            
            _logger.info(f"✓ Prioridad del ticket {record.id} recalculada: {ia_result['prioridad']} (origen: {ia_result.get('origen')})")
        
        _logger.info("="*60)
        
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Prioridad Recalculada',
                'message': f'La prioridad ha sido actualizada a: {self.prioridad}',
                'type': 'success',
                'sticky': False,
            }
        }
        
    def _simular_clasificacion_ia(self, titulo, descripcion):
        """ 
        Clasificación de prioridad usando OpenAI API.
        Analiza título y descripción para clasificar prioridad.
        Referencia: Stand Proud - JoJo's Bizarre Adventure
        """
        _logger.info("="*60)
        _logger.info(f"Iniciando clasificación IA para: '{titulo}'")
        _logger.info(f"OPENAI_AVAILABLE: {OPENAI_AVAILABLE}")
        
        # Intentar usar OpenAI API si está disponible
        if OPENAI_AVAILABLE:
            api_key = os.environ.get('OPENAI_API_KEY')
            _logger.info(f"API Key encontrada: {'Sí (***' + api_key[-4:] + ')' if api_key else 'NO'}")
            
            if api_key:
                try:
                    _logger.info("Llamando a OpenAI API...")
                    result = self._clasificar_con_openai(titulo, descripcion, api_key)
                    _logger.info(f"✓ Clasificación exitosa por OpenAI: {result['prioridad']}")
                    return result
                except Exception as e:
                    _logger.error(f"✗ Error al usar OpenAI API: {str(e)}", exc_info=True)
                    _logger.warning("Fallback a clasificación por reglas")
            else:
                _logger.warning("OPENAI_API_KEY no configurada en variables de entorno")
                _logger.warning("Usando clasificación por reglas como fallback")
        else:
            _logger.warning("Librería OpenAI no está disponible. Instalar con: pip install openai")
        
        # Fallback: clasificación por reglas
        _logger.info("Usando clasificación por reglas...")
        result = self._clasificar_por_reglas(titulo, descripcion)
        _logger.info(f"Clasificación por reglas: {result['prioridad']}")
        _logger.info("="*60)
        return result
    
    def _clasificar_con_openai(self, titulo, descripcion, api_key):
        """
        Usa la API de OpenAI para clasificar la prioridad del ticket.
        """
        _logger.info("Creando cliente OpenAI...")
        client = OpenAI(api_key=api_key)
        
        prompt = f"""Eres un asistente de clasificación de tickets de soporte. 
Analiza el siguiente ticket y clasifica su prioridad en: alta, media o baja.

Título: {titulo}
Descripción: {descripcion}

Redacta la explicación en español corto siguiendo este estilo: describe el tipo de situación y menciona explícitamente las palabras o frases que activaron la clasificación, por ejemplo:
- Problema de inicio de sesión detectado por 'no puedo iniciar sesión' y 'contraseña'.
- Solicitud de actualización de contenido detectada por 'logo' y 'nuevo'.
- Bug de duplicación detectado por 'duplicadas' y 'notificaciones'.
- Error financiero detectado por 'reembolso incorrecto' y 'monto'.
- Petición de formación detectada por 'necesita una sesión' y 'actualización'.
Ajusta la redacción al contexto del ticket analizado.

Responde SOLO con un JSON en este formato:
{{
  "prioridad": "alta|media|baja",
  "explicacion": "Breve explicación de por qué se asignó esta prioridad"
}}"""
        
        _logger.info(f"Enviando request a OpenAI (modelo: gpt-3.5-turbo)...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un clasificador de prioridad de tickets. Respondes solo con JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=150
        )
        
        resultado_texto = response.choices[0].message.content.strip()
        _logger.info(f"Respuesta de OpenAI: {resultado_texto}")
        
        # Intentar parsear el JSON
        try:
            # Limpiar posibles marcadores de código
            if resultado_texto.startswith('```'):
                _logger.info("Limpiando marcadores de código al inicio...")
                resultado_texto = resultado_texto.split('\n', 1)[1]
            if resultado_texto.endswith('```'):
                _logger.info("Limpiando marcadores de código al final...")
                resultado_texto = resultado_texto.rsplit('\n', 1)[0]
            
            _logger.info(f"Parseando JSON: {resultado_texto}")
            resultado = json.loads(resultado_texto)
            prioridad = resultado.get('prioridad', 'media').lower()
            
            # Validar que la prioridad sea válida
            if prioridad not in ['alta', 'media', 'baja']:
                _logger.warning(f"Prioridad inválida '{prioridad}', usando 'media'")
                prioridad = 'media'
            
            final_result = {
                'prioridad': prioridad,
                'explicacion': resultado.get('explicacion', 'Clasificado por OpenAI'),
                'origen': 'openai'
            }
            _logger.info(f"JSON parseado exitosamente: {final_result}")
            return final_result
            
        except json.JSONDecodeError as e:
            _logger.error(f"Error al parsear respuesta de OpenAI: {resultado_texto}")
            _logger.error(f"Error JSON: {str(e)}")
            return self._clasificar_por_reglas(titulo, descripcion)
    
    def _clasificar_por_reglas(self, titulo, descripcion):
        """
        Método de clasificación por reglas (fallback).
        """
        texto_completo = f"{titulo} {descripcion}".lower()
        
        # Palabras clave para prioridad alta
        keywords_alta = ['urgente', 'crítico', 'producción', 'caído', 'bloqueado', 'bloqueo', 
                         'no funciona', 'error crítico', 'impacto alto', 'emergencia', 'inmediato']
        
        # Palabras clave para prioridad media
        keywords_media = ['problema', 'error', 'bug', 'fallo', 'no se aplica', 'lentitud', 
                          'rendimiento', 'acceso', 'permisos', 'solicitud']
        
        # Clasificación por palabras clave
        for keyword in keywords_alta:
            if keyword in texto_completo:
                return {
                    'prioridad': 'alta',
                    'explicacion': f'Palabra clave "{keyword}" indica severidad alta.',
                    'origen': 'reglas'
                }
        
        for keyword in keywords_media:
            if keyword in texto_completo:
                return {
                    'prioridad': 'media',
                    'explicacion': f'Palabra clave "{keyword}" sugiere prioridad media.',
                    'origen': 'reglas'
                }
        
        # Por defecto: prioridad baja
        return {
            'prioridad': 'baja',
            'explicacion': 'No se detectaron palabras clave de urgencia; prioridad baja por defecto.',
            'origen': 'reglas'
        }
    def mark_as_resuelto(self):
        """ Método para marcar tickets como resueltos. """
        for record in self.filtered(lambda r: r.estado != 'resuelto'):
            record.estado = 'resuelto'
    
    def recalcular_prioridad_ia(self):
        """ Recalcula la clasificación de IA para tickets existentes. """
        for record in self:
            ia_result = record._simular_clasificacion_ia(record.titulo or '', record.descripcion or '')
            record.write({
                'prioridad_ia': ia_result['prioridad'],
                'explicacion_ia': ia_result['explicacion'],
                'origen_ia': ia_result.get('origen', 'reglas'),
            })
