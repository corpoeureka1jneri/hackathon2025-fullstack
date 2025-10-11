# gestion_solicitudes/__manifest__.py
{
    'name': "Gestión de Solicitudes (Hackathon)",
    'summary': "Captura y priorización de tickets con IA.",
    'version': '1.0',
    'author': "Maikol aguilar",
    'category': 'Services/Helpdesk',
    'depends': ['base', 'http_routing', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'views/support_ticket_views.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}