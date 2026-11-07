import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "assets/images/upsc_answer_sheets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

WIDTH = 1200
HEIGHT = 1680

FONT_PRINT_BOLD = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)
FONT_PRINT_REG = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
FONT_PRINT_SMALL = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 13)
FONT_HAND_TITLE = ImageFont.truetype("C:/Windows/Fonts/segoesc.ttf", 26)
FONT_HAND = ImageFont.truetype("C:/Windows/Fonts/segoesc.ttf", 20)
FONT_HAND_SMALL = ImageFont.truetype("C:/Windows/Fonts/segoesc.ttf", 17)
FONT_EVAL = ImageFont.truetype("C:/Windows/Fonts/segoesc.ttf", 24)

COLOR_PAPER = (253, 252, 248)
COLOR_LINE = (226, 232, 240)
COLOR_MARGIN = (185, 28, 28, 160)
COLOR_TEXT_PRINT = (30, 41, 59)
COLOR_INK = (30, 58, 138)
COLOR_EVAL = (220, 38, 38)

def draw_qcab_base(draw, page_num=1, total_pages=2, q_num="Q 1 (a)", marks="10 Marks / 150 Words", q_text=""):
    draw.rectangle([(0, 0), (WIDTH, HEIGHT)], fill=COLOR_PAPER)

    # Margins
    left_m = 140
    right_m = WIDTH - 140
    draw.line([(left_m, 0), (left_m, HEIGHT)], fill=(203, 213, 225), width=2)
    draw.line([(right_m, 0), (right_m, HEIGHT)], fill=(203, 213, 225), width=2)

    # Margin text (vertical / rotated or small indicators)
    margin_warning = "उम्मीदवारों को इस हाशिए में नहीं लिखना चाहिए  |  Candidates must not write on this margin"
    # Left margin watermark
    draw.text((15, HEIGHT // 2 - 180), "CANDIDATES MUST NOT", font=FONT_PRINT_SMALL, fill=(160, 174, 192))
    draw.text((15, HEIGHT // 2 - 160), "WRITE ON THIS MARGIN", font=FONT_PRINT_SMALL, fill=(160, 174, 192))
    draw.text((15, HEIGHT // 2 - 135), "(इस हाशिए में न लिखें)", font=FONT_PRINT_SMALL, fill=(160, 174, 192))

    # Right margin watermark
    draw.text((WIDTH - 130, HEIGHT // 2 - 180), "CANDIDATES MUST NOT", font=FONT_PRINT_SMALL, fill=(160, 174, 192))
    draw.text((WIDTH - 130, HEIGHT // 2 - 160), "WRITE ON THIS MARGIN", font=FONT_PRINT_SMALL, fill=(160, 174, 192))
    draw.text((WIDTH - 130, HEIGHT // 2 - 135), "(इस हाशिए में न लिखें)", font=FONT_PRINT_SMALL, fill=(160, 174, 192))

    # Header
    draw.text((left_m + 10, 20), "UNION PUBLIC SERVICE COMMISSION (UPSC) — MAINS EXAMINATION", font=FONT_PRINT_BOLD, fill=COLOR_TEXT_PRINT)
    draw.text((left_m + 10, 48), "General Studies Question-cum-Answer Booklet (QCAB)", font=FONT_PRINT_REG, fill=(100, 116, 139))
    draw.text((right_m - 120, 48), f"Page {page_num} of {total_pages}", font=FONT_PRINT_BOLD, fill=(100, 116, 139))
    draw.line([(left_m, 75), (right_m, 75)], fill=(148, 163, 184), width=1)

    start_y = 90
    if q_text:
        # Question Box
        q_box_height = 115
        draw.rectangle([(left_m, start_y), (right_m, start_y + q_box_height)], fill=(248, 250, 252), outline=(148, 163, 184), width=1)
        draw.text((left_m + 15, start_y + 12), f"{q_num}:", font=FONT_PRINT_BOLD, fill=(15, 23, 42))
        draw.text((right_m - 190, start_y + 12), f"({marks})", font=FONT_PRINT_BOLD, fill=(185, 28, 28))
        
        # Word wrap question text
        words = q_text.split()
        lines = []
        cur = []
        for w in words:
            if len(" ".join(cur + [w])) > 80:
                lines.append(" ".join(cur))
                cur = [w]
            else:
                cur.append(w)
        if cur:
            lines.append(" ".join(cur))
        
        for idx, line in enumerate(lines):
            draw.text((left_m + 15, start_y + 42 + idx * 22), line, font=FONT_PRINT_REG, fill=(30, 41, 59))
        start_y += q_box_height + 20

    # Ruled lines
    line_y = start_y
    while line_y < HEIGHT - 60:
        draw.line([(left_m, line_y), (right_m, line_y)], fill=COLOR_LINE, width=1)
        line_y += 34

    return start_y, left_m + 20, right_m - 20

def create_ananya_p1():
    img = Image.new("RGB", (WIDTH, HEIGHT), COLOR_PAPER)
    draw = ImageDraw.Draw(img)
    q_text = "Evaluate the role of empathy and compassion in civil services. How can a public servant balance strict rule compliance with compassionate discretion during distress?"
    start_y, left_x, right_x = draw_qcab_base(draw, 1, 2, "Q 1 (a)", "10 Marks • 150 Words", q_text)

    y = start_y + 22
    draw.text((left_x, y), "Ans:", font=FONT_HAND_TITLE, fill=COLOR_INK)
    draw.text((left_x + 70, y), "Empathy & Compassion in Public Service", font=FONT_HAND_TITLE, fill=COLOR_INK)
    draw.line([(left_x + 70, y + 36), (left_x + 580, y + 36)], fill=COLOR_INK, width=2)
    y += 55

    lines = [
        "Civil services operate not merely as mechanical administrative machinery,",
        "but as the primary interface between the State and vulnerable citizens.",
        "• Empathy: Cognitive ability to perceive another's suffering from their perspective.",
        "• Compassion: Active moral impetus and desire to alleviate that distress (Antyodaya).",
    ]
    for line in lines:
        draw.text((left_x, y), line, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    y += 15
    draw.text((left_x, y), "I. Balancing Rule Compliance vs Compassionate Discretion:", font=FONT_HAND_TITLE, fill=COLOR_INK)
    draw.line([(left_x, y + 34), (left_x + 700, y + 34)], fill=COLOR_INK, width=1)
    y += 45

    points = [
        "1. Weberian Rule Compliance provides uniformity, prevents nepotism, and guarantees",
        "   procedural accountability under democratic statutes.",
        "2. Rigid Procedural Fetishism ('Bureaucratic Red-Tape') often denies fundamental",
        "   rights to the weakest (e.g. starvation deaths due to biometric mismatch).",
        "3. Compassionate Discretion allows civil servants to invoke the substantive spirit",
        "   of law over rigid procedural dogma in acute crisis situations.",
    ]
    for pt in points:
        draw.text((left_x, y), pt, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    # Flowchart Diagram
    y += 20
    box1_x, box1_y = left_x + 30, y
    draw.rectangle([(box1_x, box1_y), (box1_x + 220, box1_y + 70)], outline=COLOR_INK, width=2, fill=(241, 245, 249))
    draw.text((box1_x + 20, box1_y + 10), "Rule Compliance", font=FONT_HAND_SMALL, fill=COLOR_INK)
    draw.text((box1_x + 25, box1_y + 36), "(Accountability)", font=FONT_HAND_SMALL, fill=(71, 85, 105))

    draw.text((box1_x + 235, box1_y + 20), "+", font=FONT_HAND_TITLE, fill=COLOR_INK)

    box2_x = box1_x + 270
    draw.rectangle([(box2_x, box1_y), (box2_x + 240, box1_y + 70)], outline=COLOR_INK, width=2, fill=(241, 245, 249))
    draw.text((box2_x + 15, box1_y + 10), "Empathetic Discretion", font=FONT_HAND_SMALL, fill=COLOR_INK)
    draw.text((box2_x + 25, box1_y + 36), "(Moral Compass)", font=FONT_HAND_SMALL, fill=(71, 85, 105))

    draw.text((box2_x + 255, box1_y + 20), "==>", font=FONT_HAND_TITLE, fill=COLOR_INK)

    box3_x = box2_x + 320
    draw.rectangle([(box3_x, box1_y), (box3_x + 240, box1_y + 70)], outline=(16, 185, 129), width=2, fill=(236, 253, 245))
    draw.text((box3_x + 15, box1_y + 10), "Constitutional Morality", font=FONT_HAND_SMALL, fill=(4, 120, 87))
    draw.text((box3_x + 35, box1_y + 36), "(Article 21 Upheld)", font=FONT_HAND_SMALL, fill=(5, 150, 105))

    y += 100
    draw.text((left_x, y), "• Nolan Committee: 'Integrity & Objectivity must harmonize with Public Interest.'", font=FONT_HAND, fill=COLOR_INK)

    # Examiner annotations in Red
    draw.text((WIDTH - 280, 260), "✓ Good conceptual clarity", font=FONT_EVAL, fill=COLOR_EVAL)
    draw.text((WIDTH - 250, 680), "✓ Well-structured diagram", font=FONT_EVAL, fill=COLOR_EVAL)
    draw.text((WIDTH - 210, HEIGHT - 100), "[PTO ->]", font=FONT_HAND_TITLE, fill=COLOR_INK)

    img.save(os.path.join(OUTPUT_DIR, "upsc_sheet_gs4_q1_p1.jpg"), quality=92)
    print("Saved upsc_sheet_gs4_q1_p1.jpg")

def create_ananya_p2():
    img = Image.new("RGB", (WIDTH, HEIGHT), COLOR_PAPER)
    draw = ImageDraw.Draw(img)
    start_y, left_x, right_x = draw_qcab_base(draw, 2, 2, "Q 1 (a) Contd.", "10 Marks", "")

    y = start_y + 25
    draw.text((left_x, y), "II. Real-World Case Demonstration (District Flood Relief):", font=FONT_HAND_TITLE, fill=COLOR_INK)
    draw.line([(left_x, y + 34), (left_x + 650, y + 34)], fill=COLOR_INK, width=1)
    y += 50

    lines = [
        "Case Study: During recent flash floods in Assam / Uttarakhand,",
        "displaced families lacked ration cards / Aadhaar due to washed-away homes.",
        "• Strict Compliance Approach: Refuse relief grains without documents.",
        "   -> Outcome: Deprivation, starvation, loss of citizen trust.",
        "• Empathetic Discretionary Approach: District Collector authorizes emergency food kits",
        "   on visual spot-verification with post-facto documentation audit.",
        "   -> Outcome: Immediate human dignity saved; public safety prioritized.",
    ]
    for line in lines:
        draw.text((left_x, y), line, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    y += 20
    draw.text((left_x, y), "III. Safeguards Against Arbitrary Abuse of Discretion:", font=FONT_HAND_TITLE, fill=COLOR_INK)
    draw.line([(left_x, y + 34), (left_x + 580, y + 34)], fill=COLOR_INK, width=1)
    y += 45

    points = [
        "1. Written Justification: Officer must record reasons in official case notes.",
        "2. Peer Review & Social Audit: Transparent public disclosure to ward off bias.",
        "3. Alignment with Constitutional Values: Discretion must favor the marginalized,",
        "   fulfilling Preamble goals of Justice (Social, Economic & Political).",
    ]
    for pt in points:
        draw.text((left_x, y), pt, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    y += 30
    draw.text((left_x, y), "Conclusion:", font=FONT_HAND_TITLE, fill=COLOR_INK)
    draw.line([(left_x, y + 34), (left_x + 130, y + 34)], fill=COLOR_INK, width=1)
    y += 45

    concl = [
        "As Mahatma Gandhi's Talisman advises: recall the face of the poorest person and ask",
        "if your step leads to Swaraj. Rules are institutional tools; citizen welfare is the goal.",
        "True civil service excellence lies in being legally robust yet humanly responsive.",
    ]
    for c in concl:
        draw.text((left_x, y), c, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    # Examiner marks
    draw.text((WIDTH - 300, 310), "✓ Concrete field example", font=FONT_EVAL, fill=COLOR_EVAL)
    draw.text((WIDTH - 320, 640), "✓ Good safeguards listed", font=FONT_EVAL, fill=COLOR_EVAL)

    # Score box
    draw.rectangle([(WIDTH - 260, HEIGHT - 180), (WIDTH - 145, HEIGHT - 80)], outline=COLOR_EVAL, width=3, fill=(254, 242, 242))
    draw.text((WIDTH - 245, HEIGHT - 165), "Marks:", font=FONT_PRINT_BOLD, fill=COLOR_EVAL)
    draw.text((WIDTH - 245, HEIGHT - 135), "6.5 / 10", font=FONT_PRINT_BOLD, fill=COLOR_EVAL)

    img.save(os.path.join(OUTPUT_DIR, "upsc_sheet_gs4_q1_p2.jpg"), quality=92)
    print("Saved upsc_sheet_gs4_q1_p2.jpg")

def create_gs4_case_p1():
    img = Image.new("RGB", (WIDTH, HEIGHT), COLOR_PAPER)
    draw = ImageDraw.Draw(img)
    q_text = "You are a senior technical officer overseeing procurement of medical equipment for district hospitals. You detect compromised safety certifications awarded to a politically favored vendor."
    start_y, left_x, right_x = draw_qcab_base(draw, 1, 3, "Q 7 (Ethics Case Study)", "20 Marks • 250 Words", q_text)

    y = start_y + 20
    draw.text((left_x, y), "Ans: Conflict between Loyalty, Integrity & Public Safety", font=FONT_HAND_TITLE, fill=COLOR_INK)
    y += 50

    lines = [
        "1. Stakeholder Matrix:",
        "• Patients & Public: Direct threat to life (Right to Health under Article 21).",
        "• Hospital Administration & Doctors: Relying on faulty equipment in trauma care.",
        "• Politically Favored Vendor: Commercial greed compromising quality standards.",
        "• Myself as Technical Officer: Ethical duty vs professional pressure & transfer risks.",
    ]
    for line in lines:
        draw.text((left_x, y), line, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    y += 20
    draw.text((left_x, y), "2. Ethical Dilemmas Involved:", font=FONT_HAND_TITLE, fill=COLOR_INK)
    y += 45
    pts = [
        "• Organizational Loyalty vs Public Interest & Duty of Care.",
        "• Career Preservation vs Moral Courage & Whistleblower Protections.",
        "• Rule of Law vs Political Coercion in Government Procurement.",
    ]
    for p in pts:
        draw.text((left_x, y), p, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    y += 30
    draw.text((left_x, y), "3. Available Courses of Action & Evaluation:", font=FONT_HAND_TITLE, fill=COLOR_INK)
    y += 45
    actions = [
        "Option A: Approve equipment under protest to protect career -> Unacceptable.",
        "Option B: Immediate leaked anonymous whistleblower -> Impulsive, bypasses hierarchy.",
        "Option C: Formal dissent in technical appraisal + Vigilance escalate -> Recommended.",
    ]
    for a in actions:
        draw.text((left_x, y), a, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    draw.text((WIDTH - 290, 280), "✓ Good stakeholder matrix", font=FONT_EVAL, fill=COLOR_EVAL)
    draw.text((WIDTH - 280, 560), "✓ Clear ethical dilemmas", font=FONT_EVAL, fill=COLOR_EVAL)
    draw.text((WIDTH - 210, HEIGHT - 100), "[PTO ->]", font=FONT_HAND_TITLE, fill=COLOR_INK)

    img.save(os.path.join(OUTPUT_DIR, "upsc_sheet_gs4_case_p1.jpg"), quality=92)
    print("Saved upsc_sheet_gs4_case_p1.jpg")

def create_gs1_tundra_p1():
    img = Image.new("RGB", (WIDTH, HEIGHT), COLOR_PAPER)
    draw = ImageDraw.Draw(img)
    q_text = "'Tundra regions are ecologically fragile but economically important.' Examine this statement critically."
    start_y, left_x, right_x = draw_qcab_base(draw, 1, 2, "Q 5 (World Geography)", "10 Marks • 150 Words", q_text)

    y = start_y + 20
    draw.text((left_x, y), "Ans: Tundra Biome — Fragility vs Geoeconomic Potential", font=FONT_HAND_TITLE, fill=COLOR_INK)
    y += 50

    lines = [
        "The Tundra biome spans high latitudes of the Arctic (Russia, Canada, Scandinavia).",
        "It presents an acute tension between fragile cryosphere ecology and resource extraction.",
    ]
    for l in lines:
        draw.text((left_x, y), l, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    # Arctic map diagram representation
    y += 20
    map_cx, map_cy = left_x + 180, y + 100
    draw.ellipse([(map_cx - 80, map_cy - 80), (map_cx + 80, map_cy + 80)], outline=COLOR_INK, width=2)
    draw.text((map_cx - 35, map_cy - 12), "North Pole", font=FONT_HAND_SMALL, fill=COLOR_INK)
    draw.arc([(map_cx - 130, map_cy - 130), (map_cx + 130, map_cy + 130)], start=0, end=360, fill=(100, 116, 139), width=1)
    draw.text((map_cx - 40, map_cy + 90), "Arctic Circle 66.5°N", font=FONT_PRINT_SMALL, fill=(100, 116, 139))

    # Notes next to map
    draw.text((map_cx + 120, y + 20), "• Permafrost Layer (Frozen Methane sink)", font=FONT_HAND_SMALL, fill=COLOR_INK)
    draw.text((map_cx + 120, y + 60), "• Slow Pedogenesis & Nutrient-poor soil", font=FONT_HAND_SMALL, fill=COLOR_INK)
    draw.text((map_cx + 120, y + 100), "• Lichens & Mosses: Low biodiversity", font=FONT_HAND_SMALL, fill=COLOR_INK)
    draw.text((map_cx + 120, y + 140), "• Northern Sea Route (NSR) commercial transit", font=FONT_HAND_SMALL, fill=COLOR_INK)

    y += 220
    pts = [
        "1. Ecological Fragility:",
        "   - Thawing permafrost triggers irreversible methane greenhouse feedback loop.",
        "   - Extremely slow biotic recovery: Tire tracks take 50+ years to regenerate.",
        "2. Economic Importance:",
        "   - Hydrocarbon wealth: Yamal LNG, Prudhoe Bay Alaska crude.",
        "   - Rare Earths & strategic minerals (Norilsk Nickel, Cobalt, Platinum).",
        "   - Shorter maritime trade connectivity via Northern Sea Route.",
    ]
    for p in pts:
        draw.text((left_x, y), p, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    draw.text((WIDTH - 300, 310), "✓ Excellent map diagram", font=FONT_EVAL, fill=COLOR_EVAL)
    draw.text((WIDTH - 280, 680), "✓ Methane feedback cited", font=FONT_EVAL, fill=COLOR_EVAL)

    # Score box
    draw.rectangle([(WIDTH - 260, HEIGHT - 180), (WIDTH - 145, HEIGHT - 80)], outline=COLOR_EVAL, width=3, fill=(254, 242, 242))
    draw.text((WIDTH - 245, HEIGHT - 165), "Marks:", font=FONT_PRINT_BOLD, fill=COLOR_EVAL)
    draw.text((WIDTH - 245, HEIGHT - 135), "6.0 / 10", font=FONT_PRINT_BOLD, fill=COLOR_EVAL)

    img.save(os.path.join(OUTPUT_DIR, "upsc_sheet_gs1_tundra_p1.jpg"), quality=92)
    print("Saved upsc_sheet_gs1_tundra_p1.jpg")

def create_gs2_judicial_p1():
    img = Image.new("RGB", (WIDTH, HEIGHT), COLOR_PAPER)
    draw = ImageDraw.Draw(img)
    q_text = "Examine the delicate line between judicial activism and judicial adventurism in India. Support your answer with relevant constitutional provisions and landmark cases."
    start_y, left_x, right_x = draw_qcab_base(draw, 1, 1, "Q 3 (GS-II Polity & Constitution)", "15 Marks • 250 Words", q_text)

    y = start_y + 20
    draw.text((left_x, y), "Ans: Judicial Activism vs Judicial Adventurism", font=FONT_HAND_TITLE, fill=COLOR_INK)
    y += 50

    lines = [
        "Judicial review forms the bedrock of India's constitutionalism (Basic Structure Doctrine).",
        "However, the judiciary must navigate between legitimate activism and overreach.",
        "• Judicial Activism: Proactive defense of citizens' fundamental rights when executive",
        "  fails to act (e.g. Bandhua Mukti Morcha, Vishaka Guidelines under Art 142).",
        "• Judicial Adventurism (Overreach): Usurpation of legislative & policy domain without",
        "  expertise or democratic accountability (e.g. liquor ban on highways, Diwali firecracker bans).",
    ]
    for l in lines:
        draw.text((left_x, y), l, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    y += 20
    draw.text((left_x, y), "Constitutional Safeguards & Jurisprudence:", font=FONT_HAND_TITLE, fill=COLOR_INK)
    y += 45
    pts = [
        "1. Separation of Powers (Art 50): Requires institutional self-restraint.",
        "2. Justice Punchhi Commission: Urged judicial restraint to preserve judicial legitimacy.",
        "3. Judicial Dictum: In Aravali Golf Course (2007), SC warned judges not to run governments.",
    ]
    for p in pts:
        draw.text((left_x, y), p, font=FONT_HAND, fill=COLOR_INK)
        y += 36

    draw.text((WIDTH - 290, 290), "✓ Good case laws cited", font=FONT_EVAL, fill=COLOR_EVAL)
    draw.text((WIDTH - 290, 600), "✓ Punchhi Commission cited", font=FONT_EVAL, fill=COLOR_EVAL)

    # Score box
    draw.rectangle([(WIDTH - 260, HEIGHT - 180), (WIDTH - 145, HEIGHT - 80)], outline=COLOR_EVAL, width=3, fill=(254, 242, 242))
    draw.text((WIDTH - 245, HEIGHT - 165), "Marks:", font=FONT_PRINT_BOLD, fill=COLOR_EVAL)
    draw.text((WIDTH - 245, HEIGHT - 135), "9.5 / 15", font=FONT_PRINT_BOLD, fill=COLOR_EVAL)

    img.save(os.path.join(OUTPUT_DIR, "upsc_sheet_gs2_judicial_p1.jpg"), quality=92)
    print("Saved upsc_sheet_gs2_judicial_p1.jpg")

if __name__ == "__main__":
    create_ananya_p1()
    create_ananya_p2()
    create_gs4_case_p1()
    create_gs1_tundra_p1()
    create_gs2_judicial_p1()
    print("All authentic UPSC answer sheets generated successfully!")

