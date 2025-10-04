from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def generate_certificate(template_path, name, position, output_path):
    c = canvas.Canvas(output_path, pagesize=A4)
    c.drawImage(template_path, 0, 0, width=A4[0], height=A4[1])
    c.setFont("Helvetica-Bold", 36)
    c.drawString(position['x'], position['y'], name)
    c.save()