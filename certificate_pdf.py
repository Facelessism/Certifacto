from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def generate_certificate(template_path, name, position, output_path, font_size=36, font_name="Helvetica-Bold"):
    try:
        c = canvas.Canvas(output_path, pagesize=A4)
        c.drawImage(template_path, 0, 0, width=A4[0], height=A4[1])
        y = A4[1] - position['y']
        text_width = c.stringWidth(name, font_name, font_size)
        x = position['x'] - text_width / 2
        c.setFont(font_name, font_size)
        c.drawString(x, y, name)
        c.save()
        return True
    except Exception as e:
        print(f"Error generating certificate for {name}: {e}")
        return False
