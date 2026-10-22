"""
CPCB Designated Best Use Water Quality Criteria
Reference: Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Govt of India.
"""

def determine_cpcb_class(ph, do, bod, tc=None, fc=None, ec=None, ammonia=None, sar=None):
    """
    Classifies a water sample according to CPCB Primary Water Quality Criteria:
    - Class A: Drinking water source without conventional treatment but after disinfection
    - Class B: Outdoor bathing (Organized)
    - Class C: Drinking water source after conventional treatment and disinfection
    - Class D: Propagation of Wild life and Fisheries
    - Class E: Irrigation, Industrial Cooling, Controlled Waste disposal
    - Below Class E: Severe pollution / Non-conforming
    """
    # If core parameters are completely missing, cannot classify
    if ph is None or do is None:
        return "Unclassified"

    # Severe contamination checks (Below Class E / Non-Conforming)
    if (ph < 6.0 or ph > 9.0) or (do < 2.0) or (bod is not None and bod > 15.0):
        return "Below Class E (Severely Polluted)"

    coliform = fc if fc is not None else tc

    # Check Class A
    is_class_a = (
        (6.5 <= ph <= 8.5) and
        (do >= 6.0) and
        (bod is None or bod <= 2.0) and
        (coliform is None or coliform <= 50)
    )
    if is_class_a and bod is not None:
        return "Class A (Drinking without treatment)"

    # Check Class B
    is_class_b = (
        (6.5 <= ph <= 8.5) and
        (do >= 5.0) and
        (bod is None or bod <= 3.0) and
        (coliform is None or coliform <= 500)
    )
    if is_class_b and bod is not None:
        return "Class B (Outdoor Bathing)"

    # Check Class C
    is_class_c = (
        (6.0 <= ph <= 9.0) and
        (do >= 4.0) and
        (bod is None or bod <= 3.0) and
        (coliform is None or coliform <= 5000)
    )
    if is_class_c:
        return "Class C (Drinking after conventional treatment)"

    # Check Class D
    is_class_d = (
        (6.5 <= ph <= 8.5) and
        (do >= 4.0) and
        (ammonia is None or ammonia <= 1.2)
    )
    if is_class_d:
        return "Class D (Wildlife & Fisheries)"

    # Check Class E
    is_class_e = (
        (6.0 <= ph <= 8.5) and
        (ec is None or ec <= 2250) and
        (sar is None or sar <= 26)
    )
    if is_class_e:
        return "Class E (Irrigation & Industrial Cooling)"

    return "Below Class E (Non-Conforming)"
