"""
Kenya Counties Data
Contains all 47 counties of Kenya with their codes and regions
"""

KENYA_COUNTIES = [
    {"code": "001", "name": "Mombasa", "region": "Coast"},
    {"code": "002", "name": "Kwale", "region": "Coast"},
    {"code": "003", "name": "Kilifi", "region": "Coast"},
    {"code": "004", "name": "Tana River", "region": "Coast"},
    {"code": "005", "name": "Lamu", "region": "Coast"},
    {"code": "006", "name": "Taita Taveta", "region": "Coast"},
    {"code": "007", "name": "Garissa", "region": "North Eastern"},
    {"code": "008", "name": "Wajir", "region": "North Eastern"},
    {"code": "009", "name": "Mandera", "region": "North Eastern"},
    {"code": "010", "name": "Marsabit", "region": "Eastern"},
    {"code": "011", "name": "Isiolo", "region": "Eastern"},
    {"code": "012", "name": "Meru", "region": "Eastern"},
    {"code": "013", "name": "Tharaka Nithi", "region": "Eastern"},
    {"code": "014", "name": "Embu", "region": "Eastern"},
    {"code": "015", "name": "Kitui", "region": "Eastern"},
    {"code": "016", "name": "Machakos", "region": "Eastern"},
    {"code": "017", "name": "Makueni", "region": "Eastern"},
    {"code": "018", "name": "Nyandarua", "region": "Central"},
    {"code": "019", "name": "Nyeri", "region": "Central"},
    {"code": "020", "name": "Kirinyaga", "region": "Central"},
    {"code": "021", "name": "Murang'a", "region": "Central"},
    {"code": "022", "name": "Kiambu", "region": "Central"},
    {"code": "023", "name": "Turkana", "region": "Rift Valley"},
    {"code": "024", "name": "West Pokot", "region": "Rift Valley"},
    {"code": "025", "name": "Samburu", "region": "Rift Valley"},
    {"code": "026", "name": "Trans Nzoia", "region": "Rift Valley"},
    {"code": "027", "name": "Uasin Gishu", "region": "Rift Valley"},
    {"code": "028", "name": "Elgeyo Marakwet", "region": "Rift Valley"},
    {"code": "029", "name": "Nandi", "region": "Rift Valley"},
    {"code": "030", "name": "Baringo", "region": "Rift Valley"},
    {"code": "031", "name": "Laikipia", "region": "Rift Valley"},
    {"code": "032", "name": "Nakuru", "region": "Rift Valley"},
    {"code": "033", "name": "Narok", "region": "Rift Valley"},
    {"code": "034", "name": "Kajiado", "region": "Rift Valley"},
    {"code": "035", "name": "Kericho", "region": "Rift Valley"},
    {"code": "036", "name": "Bomet", "region": "Rift Valley"},
    {"code": "037", "name": "Kakamega", "region": "Western"},
    {"code": "038", "name": "Vihiga", "region": "Western"},
    {"code": "039", "name": "Bungoma", "region": "Western"},
    {"code": "040", "name": "Busia", "region": "Western"},
    {"code": "041", "name": "Siaya", "region": "Nyanza"},
    {"code": "042", "name": "Kisumu", "region": "Nyanza"},
    {"code": "043", "name": "Homa Bay", "region": "Nyanza"},
    {"code": "044", "name": "Migori", "region": "Nyanza"},
    {"code": "045", "name": "Kisii", "region": "Nyanza"},
    {"code": "046", "name": "Nyamira", "region": "Nyanza"},
    {"code": "047", "name": "Nairobi", "region": "Nairobi"}
]

def get_counties_by_region():
    """Group counties by region"""
    regions = {}
    for county in KENYA_COUNTIES:
        region = county["region"]
        if region not in regions:
            regions[region] = []
        regions[region].append(county)
    return regions

def get_county_by_code(code):
    """Get county by code"""
    for county in KENYA_COUNTIES:
        if county["code"] == code:
            return county
    return None

def get_county_by_name(name):
    """Get county by name"""
    for county in KENYA_COUNTIES:
        if county["name"].lower() == name.lower():
            return county
    return None 