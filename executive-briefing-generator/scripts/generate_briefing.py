#!/usr/bin/env python3
"""
Executive Briefing Generator - Showcase PDF v3
FINAL: Natural content flow, no blank pages, sales-ready
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.colors import Color
from datetime import datetime

# Colors
PRIMARY_DARK = HexColor('#0a1628')
PRIMARY_BLUE = HexColor('#1e3a5f')
ACCENT_CYAN = HexColor('#00d4ff')
SECTION_BG = HexColor('#132337')
WARNING_RED = HexColor('#cc3333')
SUCCESS_GREEN = HexColor('#00aa55')

def add_watermark(canvas, doc):
    """Add diagonal SAMPLE watermark to each page"""
    canvas.saveState()
    canvas.setFont('Helvetica-Bold', 60)
    canvas.setFillColor(Color(0.7, 0.7, 0.7, alpha=0.3))  # Light gray, 30% opacity
    canvas.translate(letter[0]/2, letter[1]/2)  # Center of page
    canvas.rotate(45)  # Diagonal
    canvas.drawCentredString(0, 0, "SAMPLE")
    canvas.restoreState()

def create_styles():
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

def create_warning_box(text):
    style = ParagraphStyle(name='WarnInner', fontSize=11, leading=15, textColor=white,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    content = Paragraph(text, style)
    table = Table([[content]], colWidths=[6.4*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), WARNING_RED),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    return table

def create_stat_box(stat, label):
    stat_style = ParagraphStyle(name='StatNum', fontSize=24, leading=28, textColor=ACCENT_CYAN,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    label_style = ParagraphStyle(name='StatLbl', fontSize=9, leading=12, textColor=white,
        fontName='Helvetica', alignment=TA_CENTER)
    content = [[Paragraph(stat, stat_style)], [Paragraph(label, label_style)]]
    table = Table(content, colWidths=[2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_DARK),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return table

def create_table(data, col_widths, header=True):
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
    story.append(Spacer(1, 0.8*inch))
    
    logo_style = ParagraphStyle(name='Logo', fontSize=14, textColor=ACCENT_CYAN,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    story.append(Paragraph("QUANTUM SHIELD LABS", logo_style))
    story.append(Spacer(1, 0.3*inch))
    
    title_style = ParagraphStyle(name='TitleBox', fontSize=26, leading=32, textColor=white,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    title_content = [[Paragraph("POST-QUANTUM SECURITY", title_style)],
                     [Paragraph("EXECUTIVE BRIEFING", title_style)]]
    title_table = Table(title_content, colWidths=[6*inch])
    title_table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), PRIMARY_DARK),
        ('PADDING', (0, 0), (-1, -1), 22)]))
    story.append(title_table)
    
    story.append(Spacer(1, 0.25*inch))
    client_style = ParagraphStyle(name='Client', fontSize=18, leading=24, textColor=PRIMARY_BLUE,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    story.append(Paragraph("Chesapeake Regional Medical Center", client_style))
    
    prep_style = ParagraphStyle(name='Prep', fontSize=11, leading=16, textColor=HexColor('#444444'),
        fontName='Helvetica', alignment=TA_CENTER)
    story.append(Paragraph("Prepared for: <b>David Morrison</b>, CISO", prep_style))
    
    story.append(Spacer(1, 0.4*inch))
    stats_data = [[create_stat_box("500K", "Patient Records"),
                   create_stat_box("$200M+", "Potential Liability"),
                   create_stat_box("2027", "Threat Timeline")]]
    stats_table = Table(stats_data, colWidths=[2.2*inch, 2.2*inch, 2.2*inch])
    story.append(stats_table)
    
    story.append(Spacer(1, 0.4*inch))
    footer_style = ParagraphStyle(name='CoverFoot', fontSize=10, textColor=HexColor('#666666'),
        fontName='Helvetica', alignment=TA_CENTER)
    story.append(Paragraph(f"Report Date: {datetime.now().strftime('%B %d, %Y')}", footer_style))
    story.append(Paragraph("CONFIDENTIAL — FOR INTERNAL USE ONLY", footer_style))
    
    story.append(PageBreak())  # Only page break after cover
    
    # ============ EXECUTIVE SUMMARY ============
    story.append(Paragraph("EXECUTIVE SUMMARY", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(create_warning_box("CRITICAL: Your organization faces 'Harvest Now, Decrypt Later' attacks NOW"))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph(
        """Chesapeake Regional Medical Center maintains <b>moderate security</b> with AES-256 and 
        TLS 1.2 encryption. However, this assessment reveals <b>significant quantum readiness gaps</b> 
        that expose the organization to immediate and long-term risks. Nation-state actors are actively 
        harvesting encrypted healthcare data today, waiting for quantum computers to decrypt it.""",
        styles['Body']))
    
    story.append(Paragraph("Risk Summary", styles['SubHead']))
    risk_data = [
        ['Category', 'Current Status', 'Risk Level'],
        ['Data in Transit (TLS 1.2)', '100% vulnerable to quantum decryption', 'CRITICAL'],
        ['Key Management (HSM)', 'Requires firmware upgrades for PQC', 'HIGH'],
        ['Encryption Inventory', 'Partial coverage—blind spots exist', 'HIGH'],
        ['Vendor PQC Readiness', 'Not assessed across 26-50 vendors', 'HIGH'],
        ['Incident Response', 'No crypto-specific procedures', 'MEDIUM'],
    ]
    story.append(create_table(risk_data, [2*inch, 2.8*inch, 1.5*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Business Impact", styles['SubHead']))
    story.append(create_box(
        """<b>Financial Exposure:</b> A quantum breach of 500,000 patient records = <font color="#ff4444">$200M to $1B</font> 
        in liability, regulatory fines, and reputation damage.<br/><br/>
        <b>ROI of Action:</b> Proactive migration delivers <font color="#00cc66">200:1 ROI</font> vs. emergency response costs."""))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Priority Actions", styles['SubHead']))
    actions = [
        "<b>Immediate (30 days):</b> Deploy automated cryptographic discovery tools",
        "<b>Short-term (90 days):</b> Complete enterprise-wide encryption inventory",
        "<b>Mid-term (12 months):</b> Implement hybrid encryption on critical systems",
        "<b>Strategic:</b> Establish vendor PQC compliance requirements in all contracts"
    ]
    for a in actions:
        story.append(Paragraph(f"• {a}", styles['QBullet']))
    
    # ============ QUANTUM RISK ASSESSMENT ============
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("QUANTUM RISK ASSESSMENT", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("1. Cryptographic Failure Scenario", styles['SubHead']))
    story.append(Paragraph(
        """Your <b>AES-256</b> for data at rest is quantum-resistant. However, <b>TLS 1.2</b> handshakes 
        using RSA/ECC are <font color="#cc3333">100% vulnerable</font> to Shor's algorithm. A quantum 
        computer breaks these completely—not just weakens them. Your HSMs need firmware upgrades for 
        NIST post-quantum standards, and attackers could forge signatures to alter records or manipulate devices.""",
        styles['Body']))
    
    story.append(Paragraph("2. Why Your 5-10 Year Timeline is Dangerous", styles['SubHead']))
    story.append(create_warning_box("Waiting to start migration ignores healthcare's unique constraints"))
    story.append(Spacer(1, 0.08*inch))
    
    timeline_data = [
        ['Factor', 'Reality', 'Your Risk'],
        ['Migration Time', '3-4 years for orderly transition', 'If you wait, protection arrives 2032+'],
        ['Q-Day Estimates', 'Experts predict 2027-2030', 'Records exposed before migration completes'],
        ['HIPAA Retention', '50+ year confidentiality required', '44-year exposure window for today\'s data'],
        ['Retroactive Fix?', 'PQC cannot protect already-encrypted data', 'Current records remain permanently exposed'],
    ]
    story.append(create_table(timeline_data, [1.5*inch, 2.3*inch, 2.5*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("3. Harvest Now, Decrypt Later (HNDL) Threat", styles['SubHead']))
    story.append(Paragraph(
        """Assume your <b>100,000-500,000 patient records</b> are being harvested NOW by nation-state 
        actors. Medical data never expires—genetic markers, mental health diagnoses, and chronic conditions 
        remain valuable for blackmail and fraud for the patient's entire life plus 50 years.""",
        styles['Body']))
    
    story.append(create_box(
        """<b>HNDL Attack Pattern:</b><br/>
        1. Adversaries passively intercept encrypted traffic (completely undetectable)<br/>
        2. Data archived in long-term storage awaiting quantum computers<br/>
        3. Once quantum capability arrives, ALL historical data is decrypted simultaneously<br/>
        4. Mass exposure occurs with no warning until records appear on dark web"""))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("4. Encryption Inventory Blind Spots", styles['SubHead']))
    story.append(Paragraph(
        """Your partial inventory and spreadsheet tracking create critical gaps. Security audits typically 
        discover that <b>40-60% of data stores</b> are not encrypted as assumed. Your quantum safety is 
        limited by your <b>slowest vendor</b>—and you haven't assessed any of them for PQC readiness.""",
        styles['Body']))
    
    blind_spots = [
        ['Blind Spot', 'Discovery Method', 'Typical Finding'],
        ['Undocumented encryption', 'Automated ACDI scan', '40-60% gaps found'],
        ['Vendor dependencies', 'Supply chain assessment', 'Weakest link exposure'],
        ['Shadow IT systems', 'Network discovery', 'Unauthorized weak crypto'],
        ['Integration points', 'Data flow mapping', 'Unprotected handoffs'],
    ]
    story.append(create_table(blind_spots, [1.8*inch, 2.2*inch, 2.3*inch]))
    
    # ============ NIST STANDARDS ============
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("NIST PQC STANDARDS & TECHNICAL REQUIREMENTS", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph(
        """NIST finalized post-quantum cryptography standards in <b>August 2024</b>. These are now 
        mandatory for federal systems and will become the healthcare compliance baseline. Organizations 
        should begin migration immediately.""",
        styles['Body']))
    
    story.append(Paragraph("NIST PQC Standards Overview", styles['SubHead']))
    standards_data = [
        ['Standard', 'Purpose', 'Replaces', 'Healthcare Application'],
        ['FIPS 203 (ML-KEM)', 'Key Exchange', 'RSA, Diffie-Hellman', 'EHR access, VPN tunnels'],
        ['FIPS 204 (ML-DSA)', 'Digital Signatures', 'RSA, ECDSA', 'Record authentication, updates'],
        ['FIPS 205 (SLH-DSA)', 'Backup Signatures', 'Algorithm diversity', 'Long-term document integrity'],
    ]
    story.append(create_table(standards_data, [1.5*inch, 1.3*inch, 1.5*inch, 2*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Your Systems: Vulnerability Assessment", styles['SubHead']))
    systems_data = [
        ['System', 'Quantum Vulnerability', 'Risk Level'],
        ['Cisco AnyConnect VPN', 'RSA/DH handshakes can be intercepted and broken', 'CRITICAL'],
        ['Epic EHR', 'TLS handshakes use quantum-vulnerable algorithms', 'CRITICAL'],
        ['Microsoft 365', 'Identity verification uses breakable encryption', 'HIGH'],
        ['Azure/AWS Cloud', 'Default key management often uses classical RSA/ECC', 'HIGH'],
        ['Legacy Medical Devices', 'Hardcoded encryption cannot be patched', 'CRITICAL'],
        ['IoT Devices (100-500)', 'Insufficient compute power for PQC algorithms', 'HIGH'],
    ]
    story.append(create_table(systems_data, [1.8*inch, 3.2*inch, 1.3*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("TLS 1.2 Forward Secrecy Gap", styles['SubHead']))
    story.append(create_box(
        """<b>Critical Vulnerability:</b> TLS 1.2 with static RSA lacks forward secrecy. If your private 
        key is broken by a future quantum computer, ALL past recorded traffic becomes readable—years of 
        patient data exposed retroactively.<br/><br/>
        <b>Immediate Action:</b> Upgrade to TLS 1.3 which provides the foundation for hybrid PQC extensions."""))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Legacy Medical Device Risk", styles['SubHead']))
    story.append(Paragraph(
        """Your 100-500 IoT and medical devices represent your <b>highest long-term risk</b>. Many 
        devices stay in service 10-15 years with hardcoded encryption that cannot be updated. PQC 
        algorithms require more processing power than legacy devices can provide.""",
        styles['Body']))
    
    device_data = [
        ['Device Category', 'Quantum Risk', 'Recommended Mitigation'],
        ['Infusion Pumps', 'Hardcoded keys, no update path', 'Network isolation + monitoring'],
        ['Patient Monitors', 'Weak TLS, 10+ year lifecycles', 'Quantum-safe gateway proxy'],
        ['Imaging Systems', 'Large data transfers vulnerable', 'Hybrid encryption wrapper'],
        ['Lab Equipment', 'Often forgotten in inventory', 'Include in CBOM discovery'],
    ]
    story.append(create_table(device_data, [1.6*inch, 2.2*inch, 2.5*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Migration Framework", styles['SubHead']))
    migration_data = [
        ['Phase', 'Timeline', 'Key Activities', 'Deliverable'],
        ['Discovery', 'Months 1-6', 'Complete cryptographic inventory across all systems', 'CBOM'],
        ['Pilot', 'Months 6-12', 'Test hybrid crypto on non-critical system', 'Performance baseline'],
        ['Infrastructure', 'Year 2', 'Update HSMs, implement hybrid encryption', 'Core systems protected'],
        ['Ecosystem', 'Year 3', 'Full PQC deployment, legacy isolation', 'Complete migration'],
    ]
    story.append(create_table(migration_data, [1.1*inch, 1.1*inch, 2.8*inch, 1.3*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Key NIST Deadlines", styles['SubHead']))
    deadlines = [
        "<b>August 2024:</b> FIPS 203, 204, 205 finalized and available for implementation",
        "<b>2027-2030:</b> Expected window for cryptographically-relevant quantum computers",
        "<b>2035:</b> NIST will deprecate and disallow all quantum-vulnerable algorithms"
    ]
    for d in deadlines:
        story.append(Paragraph(f"• {d}", styles['QBullet']))
    
    story.append(create_warning_box("NIST explicitly states: Healthcare must transition 'much earlier' than 2035"))
    
    # ============ COMPLIANCE ============
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("COMPLIANCE & REGULATORY ANALYSIS", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("HHS Regulatory Direction", styles['SubHead']))
    story.append(Paragraph(
        """HHS is actively modernizing standards through the <b>HIPAA Security Rule NPRM</b>. Encryption 
        requirements are being updated to address quantum computing threats. IBM's quantum roadmap shows 
        fault-tolerant systems by end of decade—regulators are preparing accordingly.""",
        styles['Body']))
    
    story.append(Paragraph("HIPAA Security Rule Compliance Gaps", styles['SubHead']))
    story.append(create_box(
        """<b>Identified Procedural Risk:</b> Your compliance team is only <i>sometimes</i> involved 
        in cryptographic decisions. This creates risk of failing to document the "equivalent alternatives" 
        required by HIPAA when standard encryption isn't used.<br/><br/>
        <b>Audit Exposure:</b> Annual risk assessments that ignore PQC transition may be found deficient 
        by OCR as quantum threats move from theoretical to practical.""",
        WARNING_RED, white))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Vendor Management Compliance Gaps", styles['SubHead']))
    gaps_data = [
        ['Gap Area', 'Your Current State', 'Compliance Risk'],
        ['Assessment Frequency', 'Onboarding only', 'No detection of vendor encryption lapse'],
        ['Contract Language', 'Generic security terms', 'No mandate for quantum-safe methods'],
        ['Ongoing Monitoring', 'One-time review for 50 vendors', 'Systemic HIPAA oversight failure'],
    ]
    story.append(create_table(gaps_data, [1.7*inch, 2.2*inch, 2.4*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Cyber Insurance Coverage Analysis", styles['SubHead']))
    story.append(Paragraph(
        """Your $5-10M cyber insurance coverage likely contains significant exclusions that could leave 
        your organization exposed in a quantum-related breach:""",
        styles['Body']))
    
    insurance_data = [
        ['Exclusion Category', 'Risk to Your Organization'],
        ['Failure to Maintain Standards', 'Generic vendor language may trigger claim denial'],
        ['Known Regulatory Shifts', 'Non-compliance with Security Rule NPRM = coverage exclusion'],
        ['State Privacy Violations', 'Multi-state breach may exceed sub-limits by $5-50M+'],
        ['Cryptographic Failure', 'Most policies are silent on crypto-specific failures'],
    ]
    story.append(create_table(insurance_data, [2.2*inch, 4.1*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Regulatory Timeline", styles['SubHead']))
    reg_timeline = [
        "<b>Now:</b> HIPAA Privacy Rule updates and Security Rule NPRM response required",
        "<b>1-3 Years:</b> NIST PQC standards incorporated into HHS guidance via OCR",
        "<b>End of Decade:</b> Fault-tolerant quantum requires all ePHI quantum-safe"
    ]
    for r in reg_timeline:
        story.append(Paragraph(f"• {r}", styles['QBullet']))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Immediate Documentation Requirements", styles['SubHead']))
    docs = [
        "<b>Quantum-Safe Inventory:</b> Document all data protected by classical encryption",
        "<b>Revised BAA Templates:</b> Add cryptographic roadmap requirements to vendor contracts",
        "<b>IR Plan Updates:</b> Add crypto compromise and HNDL discovery playbooks",
        "<b>Board Documentation:</b> Record this briefing as evidence of due diligence"
    ]
    for d in docs:
        story.append(Paragraph(f"• {d}", styles['QBullet']))
    
    # ============ ACTION PLAN ============
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("STRATEGIC ACTION PLAN & ROADMAP", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("90-Day Quick Wins", styles['SubHead']))
    quick_data = [
        ['Timeline', 'Action Item', 'Cost', 'Outcome'],
        ['Days 1-30', 'Board briefing; update IS policy to include quantum risks', '$0', 'Leadership alignment'],
        ['Days 31-60', 'Data classification sprint for top 10% high-risk records', '$0', 'Crown jewels identified'],
        ['Days 61-90', 'Deploy ACDI pilot on EHR backup system', '$5K-$15K', 'Discovery baseline'],
    ]
    story.append(create_table(quick_data, [1.1*inch, 3.2*inch, 0.9*inch, 1.1*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("12-Month Strategic Roadmap", styles['SubHead']))
    roadmap_data = [
        ['Quarter', 'Focus Area', 'Key Activities', 'Success Metric'],
        ['Q1', 'Discovery', 'Expand ACDI enterprise-wide; replace spreadsheets', '100% inventory'],
        ['Q2', 'Risk Scoring', 'Apply quantum risk scores to all 500K records', 'Risk-ranked catalog'],
        ['Q3', 'Pilot', 'Test hybrid crypto on non-critical system', '<20% perf impact'],
        ['Q4', 'Migration', 'Begin FIPS 203 upgrade on critical systems', 'Crown jewels protected'],
    ]
    story.append(create_table(roadmap_data, [0.7*inch, 1.1*inch, 2.8*inch, 1.7*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Year 1 Budget Allocation ($500K-$2M available)", styles['SubHead']))
    budget_data = [
        ['Investment Category', 'Low Estimate', 'High Estimate', 'Priority'],
        ['Professional Services (Assessment/Planning)', '$50,000', '$155,000', 'Critical'],
        ['ACDI Tools & Enhanced Monitoring', '$30,000', '$85,000', 'Critical'],
        ['Pilot System Migration', '$40,000', '$120,000', 'High'],
        ['Staff Training & Certification', '$30,000', '$80,000', 'High'],
        ['Personnel (PM/Security Architect)', '$180,000', '$230,000', 'Critical'],
        ['TOTAL YEAR 1 INVESTMENT', '$330,000', '$670,000', '—'],
    ]
    story.append(create_table(budget_data, [2.5*inch, 1.2*inch, 1.2*inch, 1.4*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Vendor Management Improvements", styles['SubHead']))
    vendor = [
        "Send PQC readiness questionnaire to all 26-50 vendors with PHI access",
        "Add quantum security clauses to all contract renewals (deadline: Dec 2026)",
        "Evaluate Azure/AWS PQC roadmaps for cloud infrastructure alignment",
        "Establish quarterly vendor security review process (vs. onboarding-only)"
    ]
    for v in vendor:
        story.append(Paragraph(f"• {v}", styles['QBullet']))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Incident Response Integration", styles['SubHead']))
    story.append(Paragraph(
        """To align with your 12-month goal of improved incident response capabilities:""",
        styles['Body']))
    
    ir_items = [
        "<b>Define HNDL as Incident Type:</b> Add to IR plan with retrospective risk assessment trigger",
        "<b>Enhanced SIEM Monitoring:</b> Alert rules for unusual encrypted traffic capture patterns",
        "<b>Retrospective Breach Playbook:</b> Procedures for when historical data is decrypted",
        "<b>Crypto Compromise Runbook:</b> Response steps for algorithm deprecation scenarios"
    ]
    for ir in ir_items:
        story.append(Paragraph(f"• {ir}", styles['QBullet']))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Key Performance Metrics", styles['SubHead']))
    metrics_data = [
        ['Metric', 'Target Date', 'Success Criteria'],
        ['Inventory Coverage', 'Month 6', '100% of cryptographic implementations documented'],
        ['Crown Jewel Protection', 'Month 12', 'Top 20% of records in hybrid/PQC encryption'],
        ['Vendor Compliance', 'Month 6', '100% of critical vendors have documented PQC roadmaps'],
        ['Performance Validation', 'Month 9', '<20% performance degradation on migrated systems'],
        ['Compliance Integration', 'Month 12', 'Quantum threat in annual HIPAA Risk Analysis'],
    ]
    story.append(create_table(metrics_data, [1.7*inch, 1.1*inch, 3.5*inch]))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(create_box(
        """<b>Executive Dashboard Recommendation:</b> Track these metrics monthly and present to leadership 
        quarterly. Create a "Quantum Readiness Score" combining inventory completion, vendor compliance, 
        and migration progress. This provides board-level visibility into your quantum security posture."""))
    
    # ============ NEXT STEPS ============
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("RECOMMENDED NEXT STEPS", styles['SectHead']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_BLUE))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Engagement Options with Quantum Shield Labs", styles['SubHead']))
    options_data = [
        ['Service', 'Description', 'Investment', 'Timeline'],
        ['Security Playbook', 'DIY guide with templates and checklists', '$197', 'Immediate'],
        ['Strategic Assessment', '1-2 day expert audit of your environment', '$7,500', '2-3 weeks'],
        ['Migration Planning', '90-day full engagement with roadmap', '$25K-$50K', '90 days'],
        ['Ongoing Advisory', 'Quarterly reviews and compliance monitoring', '$2,500/month', 'Ongoing'],
    ]
    story.append(create_table(options_data, [1.5*inch, 2.5*inch, 1.1*inch, 1.2*inch]))
    
    story.append(Spacer(1, 0.15*inch))
    story.append(create_box(
        """<b>Ready to Take Action?</b><br/><br/>
        <b>Michael Bennett</b>, Founder & CEO<br/>
        Quantum Shield Labs<br/><br/>
        📧 michael@quantumshieldlabs.dev<br/>
        🌐 quantumshieldlabs.dev<br/><br/>
        <i>"Protecting Healthcare from Tomorrow's Threats, Today"</i>"""))
    
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("Why Quantum Shield Labs?", styles['SubHead']))
    why = [
        "<b>Healthcare Focus:</b> Specialized HIPAA compliance + quantum risk expertise",
        "<b>Practical Approach:</b> Actionable roadmaps designed for real-world budgets",
        "<b>Regulatory Alignment:</b> Deep understanding of HHS guidance and NIST evolution",
        "<b>Executive Communication:</b> Board-ready materials that translate technical to business risk"
    ]
    for w in why:
        story.append(Paragraph(f"• {w}", styles['QBullet']))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#cccccc')))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Methodology & Sources", styles['SubHead']))
    story.append(Paragraph(
        """This Executive Briefing was generated using Quantum Shield Labs' proprietary 48-question 
        assessment framework, cross-referenced against authoritative sources including NIST FIPS 
        203/204/205, HHS HIPAA Security Rule NPRM, IBM Quantum Development Roadmap, and Cloud Security 
        Alliance Quantum-Safe Working Group guidance.""",
        styles['Body']))
    
    story.append(Paragraph("Key Sources Referenced", styles['SubHead']))
    sources = [
        "NIST FIPS 203, 204, 205 — Post-Quantum Cryptography Standards (August 2024)",
        "NIST IR 8547 — Transition to Post-Quantum Cryptography Standards",
        "HHS Office for Civil Rights — HIPAA Security Rule NPRM",
        "IBM Quantum Development Roadmap — Fault Tolerance Timeline",
        "Cloud Security Alliance — Quantum-Safe Security Working Group",
        "Quantum Shield Labs — Post-Quantum Security Playbook for Healthcare"
    ]
    for s in sources:
        story.append(Paragraph(f"• {s}", styles['QBullet']))
    
    story.append(Spacer(1, 0.15*inch))
    disclaimer = ParagraphStyle(name='Disc', fontSize=9, leading=12, textColor=HexColor('#666666'),
        fontName='Helvetica', alignment=TA_JUSTIFY)
    story.append(Paragraph(
        """<b>Disclaimer:</b> This Executive Briefing is provided for informational purposes based on 
        information provided by the organization. Recommendations should be validated through detailed 
        technical assessment before implementation. Quantum threat timelines are based on current expert 
        consensus and may change as technology evolves. This document does not constitute legal advice 
        regarding HIPAA compliance or other regulatory requirements.""",
        disclaimer))
    
    story.append(Spacer(1, 0.25*inch))
    end_style = ParagraphStyle(name='End', fontSize=12, textColor=PRIMARY_BLUE,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    story.append(Paragraph("— END OF EXECUTIVE BRIEFING —", end_style))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("© 2026 Quantum Shield Labs LLC. All Rights Reserved.", styles['Foot']))

def generate_pdf():
    output_path = "/mnt/user-data/outputs/Executive_Briefing_Chesapeake_Regional_v3.pdf"
    
    doc = SimpleDocTemplate(output_path, pagesize=letter,
        rightMargin=0.6*inch, leftMargin=0.6*inch,
        topMargin=0.55*inch, bottomMargin=0.55*inch)
    
    styles = create_styles()
    story = []
    build_document(story, styles)
    doc.build(story, )
    print(f"✅ Executive Briefing v3 generated: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_pdf()
