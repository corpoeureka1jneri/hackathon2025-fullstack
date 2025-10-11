# gestion_solicitudes/models/ticket_audit.py
from odoo import fields, models, api
import logging

_logger = logging.getLogger(__name__)

class SupportTicketAudit(models.Model):
    _name = 'support.ticket.audit'
    _description = 'Auditoría de Cambios en Tickets'
    _order = 'timestamp desc'
    
    # --- Campos del Modelo ---
    ticket_id = fields.Many2one('support.ticket', string='Ticket', required=True, ondelete='cascade', index=True)
    field_name = fields.Char(string='Campo Modificado', required=True)
    old_value = fields.Text(string='Valor Anterior')
    new_value = fields.Text(string='Valor Nuevo')
    user_id = fields.Many2one('res.users', string='Usuario', required=True)
    timestamp = fields.Datetime(string='Fecha y Hora', required=True, default=fields.Datetime.now)
    change_type = fields.Selection([
        ('create', 'Creación'),
        ('update', 'Actualización'),
        ('state_change', 'Cambio de Estado'),
        ('assignment', 'Asignación'),
    ], string='Tipo de Cambio', required=True, default='update')
    description = fields.Text(string='Descripción del Cambio')
    
    @api.model
    def create_audit_entry(self, ticket_id, field_name, old_value, new_value, user_id, change_type='update', description=None):
        """
        Método auxiliar para crear entradas de auditoría de forma programática.
        """
        values = {
            'ticket_id': ticket_id,
            'field_name': field_name,
            'old_value': str(old_value) if old_value else '',
            'new_value': str(new_value) if new_value else '',
            'user_id': user_id,
            'change_type': change_type,
            'description': description or f'Campo {field_name} modificado',
        }
        return self.create(values)
    
    @api.model
    def get_ticket_audit_log(self, ticket_id, limit=None):
        """
        Obtiene el registro de auditoría de un ticket específico.
        """
        domain = [('ticket_id', '=', ticket_id)]
        return self.search(domain, limit=limit, order='timestamp desc')
