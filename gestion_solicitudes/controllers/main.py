# gestion_solicitudes/controllers/main.py
from odoo import http
from odoo.http import request
from odoo.exceptions import ValidationError
import logging

_logger = logging.getLogger(__name__)

class SupportTicketController(http.Controller):
    
    @http.route('/api/support/ticket', type='json', auth='public', methods=['POST'], csrf=False)
    def create_support_ticket(self, **kw):
        """
        Endpoint para crear un nuevo ticket de soporte desde una API externa.
        Los datos de la IA (prioridad, explicación) ya vienen calculados por el cliente.
        """
        data = request.get_json_data() or {}
        is_jsonrpc = data.get('jsonrpc') == '2.0'
        params = data.get('params') if is_jsonrpc else data
        request_id = data.get('id') if is_jsonrpc else None

        def _format_response(result=None, error=None):
            if is_jsonrpc:
                payload = {'jsonrpc': '2.0', 'id': request_id}
                if error is not None:
                    payload['error'] = error
                else:
                    payload['result'] = result
                return payload
            if error is not None:
                return {'error': error}
            return result

        # 1. Validación de campos obligatorios (solo titulo y descripcion)
        required_fields = ['titulo', 'descripcion']
        missing_fields = [field for field in required_fields if field not in (params or {})]
        if missing_fields:
            return _format_response(error={
                'code': 400,
                'message': f"Faltan campos obligatorios: {', '.join(missing_fields)}"
            })

        # 2. Validación de valores (ej: prioridad) - solo si viene especificada
        prioridad_values = [key for key, val in request.env['support.ticket']._fields['prioridad'].selection]
        if params.get('prioridad') and params.get('prioridad') not in prioridad_values:
            return _format_response(error={
                'code': 400,
                'message': f"Valor de 'prioridad' inválido. Valores permitidos: {prioridad_values}"
            })
        
        try:
            # 3. Preparación de los datos para crear el ticket
            ticket_vals = {
                'titulo': params['titulo'],
                'descripcion': params['descripcion'],
            }
            
            # Retrocompatibilidad: si vienen prioridad y datos IA del frontend, los usamos
            if params.get('prioridad'):
                ticket_vals['prioridad'] = params['prioridad']
            if params.get('prioridad_ia'):
                ticket_vals['prioridad_ia'] = params['prioridad_ia']
            if params.get('explicacion_ia'):
                ticket_vals['explicacion_ia'] = params['explicacion_ia']
            
            # Campos opcionales adicionales
            if params.get('estado'):
                ticket_vals['estado'] = params['estado']
            if params.get('asignatario'):
                # Buscar usuario por nombre si viene como string
                if isinstance(params['asignatario'], str):
                    user = request.env['res.users'].sudo().search([('name', '=', params['asignatario'])], limit=1)
                    if user:
                        ticket_vals['asignatario_id'] = user.id
                else:
                    ticket_vals['asignatario_id'] = params['asignatario']
            if params.get('origen_ia'):
                ticket_vals['origen_ia'] = params['origen_ia']
            
            # Procesar etiquetas
            if params.get('etiquetas'):
                etiquetas_ids = []
                for etiqueta_nombre in params['etiquetas']:
                    # Buscar o crear la etiqueta
                    etiqueta = request.env['support.ticket.tag'].sudo().search([('name', '=', etiqueta_nombre)], limit=1)
                    if not etiqueta:
                        etiqueta = request.env['support.ticket.tag'].sudo().create({'name': etiqueta_nombre})
                    etiquetas_ids.append(etiqueta.id)
                ticket_vals['etiquetas_ids'] = [(6, 0, etiquetas_ids)]
            
            # Usamos sudo() para permitir la creación por parte de un usuario público
            # Es importante validar muy bien los datos antes de este punto.
            # Si no viene prioridad, el modelo la calculará automáticamente con IA
            ticket = request.env['support.ticket'].sudo().create(ticket_vals)
            
            _logger.info(f"Ticket creado exitosamente vía API con ID: {ticket.id}")
            
            # 4. Respuesta Exitosa
            return _format_response(result={
                'id': ticket.id,
                'message': 'Ticket creado exitosamente con clasificación de IA.',
                'prioridad_final': ticket.prioridad,
                'prioridad_ia': ticket.prioridad_ia,
                'explicacion_ia': ticket.explicacion_ia,
                'origen_ia': ticket.origen_ia,
                'etiquetas': [tag.name for tag in ticket.etiquetas_ids],
            })

        except ValidationError as e:
            _logger.error(f"Error de validación al crear ticket: {e}")
            return _format_response(error={
                'code': 400,
                'message': 'Datos inválidos.',
                'data': str(e),
            })
        except Exception as e:
            _logger.exception("Error interno del servidor al crear ticket vía API.")
            # 5. Respuesta de Error Genérico
            return _format_response(error={
                'code': 500,
                'message': 'Error interno del servidor al procesar la solicitud.',
            })

    @http.route('/api/support/tickets', type='json', auth='public', methods=['POST'], csrf=False)
    def list_support_tickets(self, **kw):
        data = request.get_json_data() or {}
        is_jsonrpc = data.get('jsonrpc') == '2.0'
        params = data.get('params') if is_jsonrpc else data
        request_id = data.get('id') if is_jsonrpc else None

        def _format_response(result=None, error=None):
            if is_jsonrpc:
                payload = {'jsonrpc': '2.0', 'id': request_id}
                if error is not None:
                    payload['error'] = error
                else:
                    payload['result'] = result
                return payload
            if error is not None:
                return {'error': error}
            return result

        limit = params.get('limit', 100)
        offset = params.get('offset', 0)

        try:
            limit = int(limit) if limit is not None else 100
            offset = int(offset) if offset is not None else 0
        except (TypeError, ValueError):
            return _format_response(error={
                'code': 400,
                'message': "Parámetros 'limit' y 'offset' deben ser numéricos.",
            })

        limit = max(1, min(limit, 500))
        offset = max(0, offset)

        tickets_records = request.env['support.ticket'].sudo().search(
            [],
            limit=limit,
            offset=offset,
            order='create_date desc'
        )
        
        # Formatear los tickets con etiquetas
        tickets = []
        for ticket in tickets_records:
            tickets.append({
                'id': ticket.id,
                'titulo': ticket.titulo,
                'descripcion': ticket.descripcion,
                'estado': ticket.estado,
                'prioridad': ticket.prioridad,
                'prioridad_ia': ticket.prioridad_ia,
                'explicacion_ia': ticket.explicacion_ia,
                'origen_ia': ticket.origen_ia,
                'asignatario_id': ticket.asignatario_id.id if ticket.asignatario_id else False,
                'asignatario': ticket.asignatario_id.name if ticket.asignatario_id else '',
                'etiquetas': [tag.name for tag in ticket.etiquetas_ids],
            })

        return _format_response(result={
            'count': len(tickets),
            'records': tickets,
        })

    @http.route('/api/support/ticket/<int:ticket_id>/change_state', type='json', auth='public', methods=['POST'], csrf=False)
    def change_ticket_state(self, ticket_id, **kw):
        """
        Endpoint para cambiar el estado de un ticket de soporte.
        Parámetros:
            - ticket_id: ID del ticket (en la URL)
            - estado: nuevo estado del ticket (nuevo, en_progreso, resuelto, cancelado)
        """
        data = request.get_json_data() or {}
        is_jsonrpc = data.get('jsonrpc') == '2.0'
        params = data.get('params') if is_jsonrpc else data
        request_id = data.get('id') if is_jsonrpc else None

        def _format_response(result=None, error=None):
            if is_jsonrpc:
                payload = {'jsonrpc': '2.0', 'id': request_id}
                if error is not None:
                    payload['error'] = error
                else:
                    payload['result'] = result
                return payload
            if error is not None:
                return {'error': error}
            return result

        # Validar que el parámetro 'estado' esté presente
        if 'estado' not in params:
            return _format_response(error={
                'code': 400,
                'message': "El campo 'estado' es obligatorio."
            })

        nuevo_estado = params['estado']

        # Validar que el estado sea válido
        estados_validos = ['nuevo', 'en_progreso', 'resuelto', 'cancelado']
        if nuevo_estado not in estados_validos:
            return _format_response(error={
                'code': 400,
                'message': f"Estado inválido. Valores permitidos: {estados_validos}"
            })

        try:
            # Buscar el ticket
            ticket = request.env['support.ticket'].sudo().browse(ticket_id)
            
            if not ticket.exists():
                return _format_response(error={
                    'code': 404,
                    'message': f"Ticket con ID {ticket_id} no encontrado."
                })

            # Guardar el estado anterior para la respuesta
            estado_anterior = ticket.estado

            # Cambiar el estado
            ticket.write({'estado': nuevo_estado})

            _logger.info(f"Estado del ticket {ticket_id} cambiado de '{estado_anterior}' a '{nuevo_estado}'")

            # Respuesta exitosa
            return _format_response(result={
                'id': ticket.id,
                'message': 'Estado del ticket actualizado exitosamente.',
                'estado_anterior': estado_anterior,
                'estado_actual': ticket.estado,
                'titulo': ticket.titulo,
            })

        except Exception as e:
            _logger.exception(f"Error al cambiar el estado del ticket {ticket_id}")
            return _format_response(error={
                'code': 500,
                'message': 'Error interno del servidor al cambiar el estado del ticket.',
            })

    @http.route('/api/support/assignees', type='json', auth='public', methods=['POST'], csrf=False)
    def list_assignees(self, **kw):
        """
        Endpoint para obtener los usuarios disponibles como asignatarios.
        Permite filtrar por estado activo y limitar resultados.
        """
        data = request.get_json_data() or {}
        is_jsonrpc = data.get('jsonrpc') == '2.0'
        params = data.get('params') if is_jsonrpc else data
        request_id = data.get('id') if is_jsonrpc else None

        def _format_response(result=None, error=None):
            if is_jsonrpc:
                payload = {'jsonrpc': '2.0', 'id': request_id}
                if error is not None:
                    payload['error'] = error
                else:
                    payload['result'] = result
                return payload
            if error is not None:
                return {'error': error}
            return result

        limit = params.get('limit', 100)
        active_only = params.get('only_active', True)

        try:
            limit = int(limit) if limit is not None else 100
        except (TypeError, ValueError):
            return _format_response(error={
                'code': 400,
                'message': "El parámetro 'limit' debe ser numérico."
            })

        limit = max(1, min(limit, 500))

        domain = []
        if active_only:
            domain.append(('active', '=', True))

        try:
            users = request.env['res.users'].sudo().search(domain, limit=limit, order='name asc')

            records = []
            for user in users:
                records.append({
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'login': user.login,
                    'active': user.active,
                })

            return _format_response(result={
                'count': len(records),
                'records': records,
            })

        except Exception:
            _logger.exception("Error al obtener los asignatarios disponibles")
            return _format_response(error={
                'code': 500,
                'message': 'Error interno del servidor al obtener los asignatarios.',
            })

    @http.route('/api/support/ticket/<int:ticket_id>/audit', type='json', auth='public', methods=['GET', 'POST'], csrf=False)
    def get_ticket_audit(self, ticket_id, **kw):
        """
        Endpoint para obtener el registro de auditoría de un ticket específico.
        Parámetros opcionales:
            - limit: Número máximo de registros a retornar
        """
        data = request.get_json_data() or {}
        is_jsonrpc = data.get('jsonrpc') == '2.0'
        params = data.get('params') if is_jsonrpc else data
        request_id = data.get('id') if is_jsonrpc else None

        def _format_response(result=None, error=None):
            if is_jsonrpc:
                payload = {'jsonrpc': '2.0', 'id': request_id}
                if error is not None:
                    payload['error'] = error
                else:
                    payload['result'] = result
                return payload
            if error is not None:
                return {'error': error}
            return result

        limit = params.get('limit') if params else None

        try:
            # Verificar que el ticket existe
            ticket = request.env['support.ticket'].sudo().browse(ticket_id)
            if not ticket.exists():
                return _format_response(error={
                    'code': 404,
                    'message': f'Ticket con ID {ticket_id} no encontrado.'
                })

            # Obtener registros de auditoría
            domain = [('ticket_id', '=', ticket_id)]
            audit_records = request.env['support.ticket.audit'].sudo().search(
                domain, 
                limit=limit if limit else None,
                order='timestamp desc'
            )

            # Formatear registros
            records = []
            for audit in audit_records:
                records.append({
                    'id': audit.id,
                    'ticketId': audit.ticket_id.id,
                    'fieldName': audit.field_name,
                    'oldValue': audit.old_value or '',
                    'newValue': audit.new_value or '',
                    'userId': audit.user_id.id,
                    'userName': audit.user_id.name,
                    'timestamp': audit.timestamp.isoformat() if audit.timestamp else '',
                    'changeType': audit.change_type,
                    'description': audit.description or '',
                })

            return _format_response(result={
                'ticketId': ticket_id,
                'count': len(records),
                'audit': records,
            })

        except Exception as e:
            _logger.exception(f"Error al obtener auditoría del ticket {ticket_id}: {str(e)}")
            return _format_response(error={
                'code': 500,
                'message': 'Error interno del servidor al obtener la auditoría.',
                'details': str(e) if hasattr(e, '__str__') else 'Error desconocido'
            })

    @http.route('/api/support/audit', type='json', auth='public', methods=['GET', 'POST'], csrf=False)
    def get_all_audit(self, **kw):
        """
        Endpoint para obtener todos los registros de auditoría.
        Parámetros opcionales:
            - limit: Número máximo de registros
            - offset: Offset para paginación
            - ticket_id: Filtrar por ID de ticket específico
        """
        data = request.get_json_data() or {}
        is_jsonrpc = data.get('jsonrpc') == '2.0'
        params = data.get('params') if is_jsonrpc else data
        request_id = data.get('id') if is_jsonrpc else None

        def _format_response(result=None, error=None):
            if is_jsonrpc:
                payload = {'jsonrpc': '2.0', 'id': request_id}
                if error is not None:
                    payload['error'] = error
                else:
                    payload['result'] = result
                return payload
            if error is not None:
                return {'error': error}
            return result

        limit = params.get('limit', 100) if params else 100
        offset = params.get('offset', 0) if params else 0
        ticket_id = params.get('ticketId') if params else None

        try:
            limit = int(limit) if limit is not None else 100
            offset = int(offset) if offset is not None else 0
        except (TypeError, ValueError):
            return _format_response(error={
                'code': 400,
                'message': "Parámetros 'limit' y 'offset' deben ser numéricos.",
            })

        limit = max(1, min(limit, 500))
        offset = max(0, offset)

        try:
            # Construir dominio de búsqueda
            domain = []
            if ticket_id:
                domain.append(('ticket_id', '=', int(ticket_id)))

            # Obtener registros de auditoría
            audit_records = request.env['support.ticket.audit'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='timestamp desc'
            )

            # Formatear registros
            records = []
            for audit in audit_records:
                records.append({
                    'id': audit.id,
                    'ticketId': audit.ticket_id.id,
                    'ticketTitle': audit.ticket_id.titulo,
                    'fieldName': audit.field_name,
                    'oldValue': audit.old_value or '',
                    'newValue': audit.new_value or '',
                    'userId': audit.user_id.id,
                    'userName': audit.user_id.name,
                    'timestamp': audit.timestamp.isoformat() if audit.timestamp else '',
                    'changeType': audit.change_type,
                    'description': audit.description or '',
                })

            return _format_response(result={
                'count': len(records),
                'audit': records,
            })

        except Exception as e:
            _logger.exception(f"Error al obtener registros de auditoría: {str(e)}")
            return _format_response(error={
                'code': 500,
                'message': 'Error interno del servidor al obtener la auditoría.',
                'details': str(e) if hasattr(e, '__str__') else 'Error desconocido'
            })
