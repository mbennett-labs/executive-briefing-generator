#!/usr/bin/env python3
"""
Product Book - Executive Briefing Generator v3
Uses SAME specs as perfected Executive Briefing v3
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus.flowables import HRFlowable

# Colors - same as briefing
PRIMARY_DARK = HexColor('#0a1628')
PRIMARY_BLUE = HexColor('#1e3a5f')
ACCENT_CYAN = HexColor('#00d4ff')
SECTION_BG = HexColor('#132337')
SUCCESS_GREEN = HexColor('#00aa55')
ACCENT_GOLD = HexColor('#ffd700')

def create_styles():
    """SAME styles as Executive Briefing v3"""
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='SectHead', fontSize=20, leading=26, textColor=PRIMARY_BLUE,
        fontName='Helvetica-Bold', spaceBefore=16, spaceAfter=8))
    styles.add(ParagraphStyle(name='SubHead', fontSize=13, leading=17, textColor=PRIMARY_BLUE,
        fontName='Helvetica-Bold', spaceBefore=12, spaceAfter=6))
    styles.add(ParagraphStyle(name='Body', fontSize=11, leading=16, textColor=black,
        fontName='Helvetica', alignment=TA_JUSTIFY, spaceAfter=8))
    styles.add(ParagraphStyle(name='QBullet', fontSize=11, leading=15, textColor=black,
        fontName='Helvetica', leftIndent=18, spaceAfter=5))
    styles.add(ParagraphStyle(name='Foot', fontSize=9, textColor=HexColor('#666666'), alignment=TA_CENTER))
    return styles

def create_box(text, box_color=SECTION_BG, text_color=white):
    """SAME box style as briefing"""
    style = ParagraphStyle(name='BoxInner', fontSize=11, leading=16, textColor=text_color,
        fontName='Helvetica', alignment=TA_LEFT)
    content = Paragraph(text, style)
    table = Table([[content]], colWidths=[6.4*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), box_color),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return table

def create_highlight(text):
    style = ParagraphStyle(name='HighInner', fontSize=12, leading=16, textColor=PRIMARY_DARK,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    content = Paragraph(text, style)
    table = Table([[content]], colWidths=[6.4*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ACCENT_GOLD),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    return table

def create_table(data, col_widths, header=True):
    """SAME table style as briefing"""
    cell_style = ParagraphStyle(name='Cell', fontSize=10, leading=13, textColor=black, fontName='Helvetica')
    header_style = ParagraphStyle(name='HdrCell', fontSize=10, leading=13, textColor=white, fontName='Helvetica-Bold')
    wrapped_data = []
    for row_idx, row in enumerate(data):
        wrapped_row = []
        for cell in row:
            if row_idx == 0 and header:
                wrapped_row.append(Paragraph(str(cell), header_style))
            else:
                wrapped_row.append(Paragraph(str(cell), cell_style))
        wrapped_data.append(wrapped_row)
    table = Table(wrapped_data, colWidths=col_widths)
    style_commands = [
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#cccccc')),
    ]
    if header:
        style_commands.append(('BACKGROUND', (0, 0), (-1, 0), PRIMARY_BLUE))
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), HexColor('#f0f0f0')))
    table.setStyle(TableStyle(style_commands))
    return table

def build_document(story, styles):
    # ============ COVER PAGE ============
    story.append(Spacer(1, 0.7*inch))
    
    logo_style = ParagraphStyle(name='Logo', fontSize=14, textColor=ACCENT_CYAN,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    story.append(Paragraph("QUANTUM SHIELD LABS", logo_style))
    story.append(Spacer(1, 0.3*inch))
    
    title_style = ParagraphStyle(name='Title', fontSize=28, leading=34, textColor=white,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    title_content = [[Paragraph("EXECUTIVE BRIEFING", title_style)],
                     [Paragraph("GENERATOR", title_style)]]
    title_table = Table(title_content, colWidths=[6*inch])
    title_table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), PRIMARY_DARK),
        ('PADDING', (0, 0), (-1, -1), 22)]))
    story.append(title_table)
    
    story.append(Spacer(1, 0.2*inch))
    sub_style = ParagraphStyle(name='Sub', fontSize=15, textColor=ACCENT_CYAN,
        fontName='Helvetica', alignment=TA_CENTER)
    story.append(Paragraph("Product Overview & Service Guide", sub_style))
    
    story.append(Spacer(1, 0.35*inch))
    story.append(create_highlight("Transform a 15-minute assessment into an 18-page personalized executive briefing"))
    
    story.append(Spacer(1, 0.35*inch))
    
    # Features - clean table
    feat_data = [
        ['🎯 Personalized', '📊 Data-Driven', '⚡ Rapid Delivery'],
        ['Tailored to YOUR org', 'Industry research backed', '24-48 hour turnaround']
    ]
    feat_table = Table(feat_data, colWidths=[2.2*inch, 2.2*inch, 2.2*inch])
    feat_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 13),
        ('FONTSIZE', (0, 1), (-1, 1), 10),
        ('TEXTCOLOR', (0, 0), (-1, 0), PRIMARY_BLUE),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(feat_table)
    
    story.append(Spacer(1, 0.4*inch))
    
    # Subtitle first, then price
    price_sub = ParagraphStyle(name='PriceSub', fontSize=12, textColor=HexColor('#444444'),
        fontName='Helvetica', alignment=TA_CENTER)
    story.append(Paragraph("One-time investment for board-ready quantum security intelligence", price_sub))
    
    story.append(Spacer(1, 0.15*inch))
    
    price_style = ParagraphStyle(name='Price', fontSize=36, textColor=SUCCESS_GREEN,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    story.append(Paragraph("$497", price_style))
    
    story.append(Spacer(1, 0.4*inch))
    
    # Circuit board image at bottom of cover
    try:
        img = Image('/mnt/user-data/uploads/ChatGPT_Image_Jan_29__2026__03_15_36_PM.png', 
                    width=7.3*inch, height=2.2*inch)
        story.append(img)
    except:
        pass  # Skip if image not found
    
    story.append(PageBreak())
    
    # ============ WHAT YOU RECEIVE ============
    story.append(Paragraph("WHAT YOU RECEIVE", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph(
        """Your Executive Briefing is a comprehensive, personalized assessment of your organization's 
        quantum security posture. Every briefing is custom-generated based on YOUR specific answers, 
        infrastructure, and risk profile—not a generic template with your name inserted.""",
        styles['Body']))
    
    story.append(Paragraph("18-Page Executive Briefing PDF", styles['SubHead']))
    sections_data = [
        ['Section', 'Pages', 'What It Covers'],
        ['Executive Summary', '2-3', 'Key findings, risk statistics, priority actions'],
        ['Risk Assessment', '3-4', 'HNDL threat analysis, timeline reality, blind spots'],
        ['Technical Standards', '2-3', 'NIST FIPS mapping, system vulnerabilities'],
        ['Compliance Analysis', '2-3', 'HIPAA gaps, vendor risks, insurance exposure'],
        ['Action Plan', '3-4', '90-day quick wins, 12-month roadmap, budget'],
        ['Next Steps', '2', 'Engagement options, methodology, sources'],
    ]
    story.append(create_table(sections_data, [1.8*inch, 0.8*inch, 3.8*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Key Features", styles['SubHead']))
    features = [
        "<b>Personalized Risk Scoring:</b> Based on YOUR employee count, patient records, and infrastructure",
        "<b>Healthcare-Specific:</b> HIPAA compliance mapping integrated throughout every section",
        "<b>Actionable Roadmaps:</b> Timelines and budgets calibrated to YOUR organization size",
        "<b>Board-Ready Format:</b> Professional presentation quality suitable for executive audiences"
    ]
    for f in features:
        story.append(Paragraph(f"• {f}", styles['QBullet']))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(create_box(
        """<b>What Makes This Different:</b> We don't just change the company name—we analyze your 
        specific assessment answers, map your infrastructure to known vulnerabilities, and calibrate 
        all recommendations to your budget constraints and organizational timeline."""))
    
    # ============ HOW IT WORKS ============
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("HOW IT WORKS", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("The 4-Step Process", styles['SubHead']))
    process_data = [
        ['Step', 'What Happens', 'Your Time'],
        ['1. Assessment', 'Complete our 48-question online form', '15-20 minutes'],
        ['2. Analysis', 'Your answers analyzed against our research database', 'None (we work)'],
        ['3. Generation', 'Custom briefing created with personalized findings', 'None (we work)'],
        ['4. Delivery', 'Professional PDF emailed directly to you', '24-48 hours total'],
    ]
    story.append(create_table(process_data, [1.1*inch, 3.2*inch, 1.3*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("What We Ask About", styles['SubHead']))
    story.append(Paragraph(
        """Our 48-question assessment covers six critical areas of your quantum security posture:""",
        styles['Body']))
    
    areas_data = [
        ['Category', 'Questions', 'What We Learn'],
        ['Organization Profile', '8', 'Size, sector, budget constraints'],
        ['Data Sensitivity', '8', 'Record types, crown jewels, retention'],
        ['Current Encryption', '8', 'Algorithms in use, inventory status'],
        ['Compliance Status', '8', 'Frameworks, audit history, gaps'],
        ['Vendor Ecosystem', '8', 'Third-party access, contract terms'],
        ['Incident Response', '8', 'Current procedures, readiness level'],
    ]
    story.append(create_table(areas_data, [1.8*inch, 1*inch, 3.6*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("The Intelligence Engine", styles['SubHead']))
    intel = [
        "<b>QSL Research Database:</b> Quantum threat intelligence and healthcare breach analysis",
        "<b>NIST Standards Library:</b> FIPS 203, 204, 205 requirements and migration guidance",
        "<b>HHS Compliance Framework:</b> HIPAA Security Rule NPRM and OCR enforcement trends",
        "<b>AI Personalization:</b> Claude synthesizes research specifically for YOUR context"
    ]
    for i in intel:
        story.append(Paragraph(f"• {i}", styles['QBullet']))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(create_box(
        """<b>The Result:</b> Not a generic report with your name swapped in—a genuine analysis 
        where every finding, every recommendation, and every budget figure is derived from YOUR 
        specific organizational context.""", SUCCESS_GREEN, white))
    
    # ============ WHY DIFFERENT ============
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("WHY THIS IS DIFFERENT", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("The Problem You Face", styles['SubHead']))
    compare_data = [
        ['Option', 'Cost', 'Time', 'Problem'],
        ['Big 4 Consulting', '$50K-$200K', '3-6 months', 'Unaffordable for mid-market'],
        ['Generic Reports', '$0-$500', 'Instant', 'Not personalized or actionable'],
        ['Internal Research', '$0 (staff time)', 'Weeks-months', 'Expertise gap, slow'],
        ['Ignore It', '$0', '—', 'Catastrophic breach liability'],
    ]
    story.append(create_table(compare_data, [1.5*inch, 1.3*inch, 1.2*inch, 2.4*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("The QSL Solution", styles['SubHead']))
    story.append(create_highlight("Enterprise-quality analysis at mid-market pricing: $497 instead of $50,000+"))
    story.append(Spacer(1, 0.08*inch))
    
    solution = [
        "<b>Personalized:</b> Generated from YOUR specific assessment answers",
        "<b>Affordable:</b> A fraction of traditional consulting costs",
        "<b>Fast:</b> 24-48 hour delivery vs. months of engagement",
        "<b>Actionable:</b> Specific recommendations with realistic timelines and budgets",
        "<b>Board-Ready:</b> Professional format suitable for executive presentation"
    ]
    for s in solution:
        story.append(Paragraph(f"• {s}", styles['QBullet']))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("The Technology Behind It", styles['SubHead']))
    story.append(Paragraph(
        """Our Executive Briefing Generator combines three powerful technologies:""",
        styles['Body']))
    
    tech_data = [
        ['Component', 'What It Does', 'Why It Matters'],
        ['NotebookLM Research', 'Queries curated knowledge base', 'Grounded in real research'],
        ['Claude AI Synthesis', 'Personalizes findings for you', 'Human-quality analysis at scale'],
        ['PDF Generation', 'Produces formatted deliverables', 'Board-ready without design work'],
    ]
    story.append(create_table(tech_data, [1.8*inch, 2.4*inch, 2.2*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(create_box(
        """<b>The Bottom Line:</b> You get the same quality of analysis that Fortune 500 companies 
        pay six figures for—personalized to YOUR organization, delivered in days not months, at a 
        price that makes sense for mid-market healthcare organizations."""))
    
    # ============ ABOUT QSL ============
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("ABOUT QUANTUM SHIELD LABS", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Our Mission", styles['SubHead']))
    story.append(Paragraph(
        """Quantum Shield Labs exists to democratize access to quantum security expertise for 
        healthcare organizations. Protecting patient data from emerging threats shouldn't require 
        a Fortune 500 budget—and now it doesn't have to.""",
        styles['Body']))
    
    story.append(Paragraph("Founder: Michael Bennett", styles['SubHead']))
    creds = [
        "<b>Education:</b> BS in Software Development & Security, UMGC (2024)",
        "<b>Technical Focus:</b> Post-quantum cryptography and healthcare cybersecurity",
        "<b>Research:</b> Author, Post-Quantum Security Playbook for Healthcare",
        "<b>Approach:</b> Practical, actionable guidance for real-world implementation"
    ]
    for c in creds:
        story.append(Paragraph(f"• {c}", styles['QBullet']))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Why Healthcare Focus?", styles['SubHead']))
    story.append(Paragraph(
        """Healthcare organizations face unique quantum security challenges that generic 
        cybersecurity consultants consistently miss:""",
        styles['Body']))
    
    healthcare = [
        "<b>50+ Year Data Sensitivity:</b> Patient records must remain confidential far longer than typical business data",
        "<b>Regulatory Complexity:</b> HIPAA, HITECH, and state laws create overlapping compliance requirements",
        "<b>Vendor Ecosystem:</b> Healthcare organizations typically have 50+ vendors with PHI access",
        "<b>Legacy Infrastructure:</b> Medical devices often cannot be patched or upgraded",
        "<b>Life-Safety Implications:</b> Security failures can directly impact patient care and safety"
    ]
    for h in healthcare:
        story.append(Paragraph(f"• {h}", styles['QBullet']))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Our Knowledge Base", styles['SubHead']))
    story.append(Paragraph(
        """Every Executive Briefing draws on our curated research database:""",
        styles['Body']))
    
    kb_data = [
        ['Source Category', 'Examples', 'Application'],
        ['NIST Standards', 'FIPS 203, 204, 205; IR 8547', 'Technical requirements'],
        ['HHS/OCR Guidance', 'Security Rule NPRM, Enforcement', 'Compliance framework'],
        ['Industry Research', 'IBM Quantum, CSA Working Groups', 'Threat timeline'],
        ['QSL Original', 'Healthcare Playbook, Threat Analysis', 'Healthcare-specific guidance'],
    ]
    story.append(create_table(kb_data, [1.5*inch, 2.5*inch, 2.4*inch]))
    
    # ============ PRICING ============
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("PRICING & ENGAGEMENT OPTIONS", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Executive Briefing Generator", styles['SubHead']))
    story.append(create_highlight("$497 — Complete Executive Briefing Package"))
    story.append(Spacer(1, 0.08*inch))
    
    included = [
        "✓ Access to 48-question online assessment",
        "✓ 18-page personalized Executive Briefing PDF",
        "✓ Quantum risk assessment based on YOUR data",
        "✓ NIST standards mapping for YOUR infrastructure",
        "✓ HIPAA compliance gap analysis",
        "✓ 90-day quick wins + 12-month strategic roadmap",
        "✓ Budget recommendations calibrated to your organization",
        "✓ Board-ready presentation format",
        "✓ 24-48 hour delivery guarantee"
    ]
    for i in included:
        story.append(Paragraph(f"    {i}", styles['QBullet']))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Additional Services", styles['SubHead']))
    services_data = [
        ['Service', 'Description', 'Investment', 'Timeline'],
        ['Security Playbook', 'DIY guide with templates', '$197', 'Immediate'],
        ['Strategic Assessment', '1-2 day expert audit', '$7,500', '2-3 weeks'],
        ['Migration Planning', '90-day full engagement', '$25K-$50K', '90 days'],
        ['Ongoing Advisory', 'Quarterly reviews', '$2,500/month', 'Ongoing'],
    ]
    story.append(create_table(services_data, [1.5*inch, 2.2*inch, 1.2*inch, 1.1*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Money-Back Guarantee", styles['SubHead']))
    story.append(create_box(
        """<b>Our Promise:</b> If your Executive Briefing doesn't provide actionable insights 
        specific to your organization, we'll refund your investment in full. No questions asked. 
        We're confident in the value we deliver.""", SUCCESS_GREEN, white))
    
    # ============ GET STARTED ============
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("GET STARTED TODAY", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Ready to Understand Your Quantum Risk?", styles['SubHead']))
    steps_data = [
        ['Step', 'Action', 'Time Required'],
        ['1', 'Visit quantumshieldlabs.dev/assessment', '1 minute'],
        ['2', 'Complete our 48-question assessment', '15-20 minutes'],
        ['3', 'Submit payment ($497)', '2 minutes'],
        ['4', 'Receive your personalized briefing', '24-48 hours'],
    ]
    story.append(create_table(steps_data, [0.7*inch, 3.5*inch, 1.4*inch]))
    
    story.append(Spacer(1, 0.15*inch))
    story.append(create_box(
        """<b>Contact Information</b><br/><br/>
        <b>Michael Bennett</b>, Founder & CEO<br/>
        Quantum Shield Labs<br/><br/>
        📧 michael@quantumshieldlabs.dev<br/>
        🌐 quantumshieldlabs.dev<br/>
        📍 Washington, DC Metro Area<br/><br/>
        <i>"Protecting Healthcare from Tomorrow's Threats, Today"</i>"""))
    
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("Frequently Asked Questions", styles['SubHead']))
    faqs = [
        "<b>Is this for small practices too?</b> Yes—briefings are calibrated to your organization size, from 50 to 10,000+ employees.",
        "<b>We already have a security consultant.</b> Great! This complements existing work with independent, specialized quantum analysis.",
        "<b>How technical is the output?</b> Designed for CISO presentation to non-technical board members—accessible but substantive.",
        "<b>Can I see a sample first?</b> Contact us for a redacted sample briefing from a similar organization type."
    ]
    for faq in faqs:
        story.append(Paragraph(f"• {faq}", styles['QBullet']))
    
    story.append(Spacer(1, 0.3*inch))
    end_style = ParagraphStyle(name='End', fontSize=12, textColor=PRIMARY_BLUE,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    story.append(Paragraph("— Thank You for Your Interest —", end_style))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("© 2026 Quantum Shield Labs LLC. All Rights Reserved.", styles['Foot']))

def generate_pdf():
    output_path = "/mnt/user-data/outputs/Executive_Briefing_Generator_Product_Book_v3.pdf"
    
    # SAME margins as Executive Briefing v3
    doc = SimpleDocTemplate(output_path, pagesize=letter,
        rightMargin=0.6*inch, leftMargin=0.6*inch,
        topMargin=0.55*inch, bottomMargin=0.55*inch)
    
    styles = create_styles()
    story = []
    build_document(story, styles)
    doc.build(story)
    print(f"✅ Product Book v3 generated: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_pdf()
