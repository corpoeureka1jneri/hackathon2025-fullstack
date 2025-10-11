# gestion_solicitudes/models/ticket_tag.py
from odoo import fields, models

class TicketTag(models.Model):
    _name = 'support.ticket.tag'
    _description = 'Etiquetas para Tickets de Soporte'
    
    name = fields.Char(string='Etiqueta', required=True, translate=True)
    color = fields.Integer(string='Color', default=0)
    
    _sql_constraints = [
        ('name_uniq', 'unique (name)', 'El nombre de la etiqueta debe ser único!')
    ]
