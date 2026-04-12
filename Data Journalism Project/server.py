from flask import Flask
from flask import render_template, request
import json

app = Flask(__name__, static_url_path='', static_folder='static')
def generate_taxes_paid(zip_percentile):
    f = open("data/taxespaid.json")
    data = json.load(f)
    f.close()
    taxes_paid_data = data[zip_percentile]
    years = list(taxes_paid_data.keys())  
    tax_shares = list(taxes_paid_data.values())  
    OG_Paid = data[zip_percentile]['1980']
    New_Paid = data[zip_percentile]['2021']



    taxes_paid_endpoints = []
    for i in range(len(years) - 1):
        start_x = years[i]
        stop_x = years[i + 1]
        taxes_paid_endpoints.append([taxes_paid_data[start_x], taxes_paid_data[stop_x]])

    return years, taxes_paid_endpoints, tax_shares, OG_Paid, New_Paid

def generate_AGI_share(zip_percentile):
    f = open("data/shares of totalAGI.json")
    data = json.load(f)
    f.close()
    shares_data = data[zip_percentile]
    years = list(shares_data.keys())  
    AGI_shares = list(shares_data.values())  
    OG_Share = data[zip_percentile]['1980']
    New_Share = data[zip_percentile]['2021']


    shares_endpoints = []
    for i in range(len(years) - 1):
        start_x = years[i]
        stop_x = years[i + 1]
        shares_endpoints.append([shares_data[start_x], shares_data[stop_x]])

    return years, shares_endpoints, AGI_shares, OG_Share, New_Share


def get_fill_color(median_income):
    if median_income>250000:
        return 'rgb(0,50,0)'
    if 200000<median_income<250000:
        return 'rgb(0,100,0)' 
    if 150000<median_income<200000:
        return 'rgb(0, 150, 0)'
    if 120000<median_income<150000:
        return 'rgb(0,200,0)'
    if 90000<median_income<120000:
        return 'rgb(100,250,100)'
    if 70000<median_income<90000:
        return "rgb(210, 180, 140)"
    if 50000<median_income<70000:
        return "rgb(240, 100, 100)"
    if 40000<median_income<50000:
        return "rgb(200, 0,0)"
    if 30000<median_income<40000:
        return "rgb(140, 0, 0)" 
    if 20000<median_income<30000:
        return "rgb(80, 0, 0)"
    if median_income==-1:
        return 'rgb(184,200,216)'
    else: 
        return "rgb(0,0,0)"
    

def get_percentile(x):
    if x>=216056:
        return "Between 6% & 10%"
    if 133451<=x<216056:
        return "Between 11% & 25%"
    if 74202<=x<133451:
        return "Between 26% & 50%"
    if x<74202:
        return "Bottom 50%"
    
    


   
@app.route('/')
def index():
    zip_colors={}
   
    zipcodes = [
    "10001", "10002", "10003", "10004", "10005", "10006", "10007", "10009", "10010", 
    "10011", "10012", "10013", "10014", "10016", "10017", "10018", "10019", "10021", 
    "10022", "10023", "10024", "10025", "10026", "10027", "10028", "10029", "10030", 
    "10031", "10032", "10033", "10034", "10035", "10036", "10037", "10038", "10039", 
    "10040", "10044", "10069", "10065", "10075", "10103", "10119", "10128", "10162", 
    "10165", "10170", "10173", "10199", "10279", "10280", "10282", "10467", "10456", 
    "10458", "10453", "10468", "10457", "10452", "10469", "10462", "10466", "10463", 
    "10472", "10460", "10473", "10451", "10461", "10459", "10465", "10475", "10455", 
    "10454", "10471", "10474", "10470", "10803", "10464", "10499", "11201", "11206", 
    "11207", "11208", "11209", "11202", "11203", "11204", "11205", "11210", "11211", 
    "11212", "11213", "11218", "11219", "11220", "11221", "11222", "11223", "11224", 
    "11225", "11214", "11215", "11216", "11217", "11226", "11228", "11229", "11230", 
    "11235", "11236", "11237", "11238", "11245", "11247", "11249", "11256", "11231", 
    "11232", "11233", "11234", "11239", "11241", "11242", "11243", "11251", "11252", 
    "11004", "11101", "11102", "11103", "11104", "11105", "11106", "11109", "11351", 
    "11354", "11355", "11356", "11357", "11358", "11359", "11360", "11361", "11362", 
    "11363", "11364", "11365", "11366", "11367", "11368", "11369", "11370", "11372", 
    "11373", "11374", "11375", "11377", "11378", "11379", "11385", "11411", "11412", 
    "11413", "11414", "11415", "11416", "11417", "11418", "11419", "11420", "11421", 
    "11422", "11423", "11426", "11427", "11428", "11429", "11432", "11433", "11434", 
    "11435", "11436", "11691", "11692", "11693", "11694", "11697",
    "10301", "10302", "10303", "10304", "10305", "10306", "10307", 
    "10308", "10309", "10310", "10311", "10312", "10313", "10314"
]
    f=open("data/incomes by zipcode.json")
    data=json.load(f)
    f.close()
    tcount=0
    rcount=0
    gcount=0
    for zipcode in zipcodes:
        zip_income=data["New York City"][zipcode]
        zip_colors[zipcode]=(get_fill_color(zip_income))
        if 70000<zip_income<90000:
            tcount+=1
        if 0<zip_income<70000:
            rcount+=1
        if zip_income>90000:
            gcount+=1
        
    return render_template('index.html', current_page='index',zipcode=zipcode,zip_income=zip_income,zip_colors=zip_colors,zipcodes=zipcodes)

@app.route('/micro/')
def micro():
    zip_percentiles={}
    zipcodes = [
    "10001", "10002", "10003", "10004", "10005", "10006", "10007", "10009", "10010", 
    "10011", "10012", "10013", "10014", "10016", "10017", "10018", "10019", "10021", 
    "10022", "10023", "10024", "10025", "10026", "10027", "10028", "10029", "10030", 
    "10031", "10032", "10033", "10034", "10035", "10036", "10037", "10038", "10039", 
    "10040", "10044", "10069", "10065", "10075", "10103", "10119", "10128", "10162", 
    "10165", "10170", "10173", "10199", "10279", "10280", "10282", "10467", "10456", 
    "10458", "10453", "10468", "10457", "10452", "10469", "10462", "10466", "10463", 
    "10472", "10460", "10473", "10451", "10461", "10459", "10465", "10475", "10455", 
    "10454", "10471", "10474", "10470", "10803", "10464", "10499", "11201", "11206", 
    "11207", "11208", "11209", "11202", "11203", "11204", "11205", "11210", "11211", 
    "11212", "11213", "11218", "11219", "11220", "11221", "11222", "11223", "11224", 
    "11225", "11214", "11215", "11216", "11217", "11226", "11228", "11229", "11230", 
    "11235", "11236", "11237", "11238", "11245", "11247", "11249", "11256", "11231", 
    "11232", "11233", "11234", "11239", "11241", "11242", "11243", "11251", "11252", 
    "11004", "11101", "11102", "11103", "11104", "11105", "11106", "11109", "11351", 
    "11354", "11355", "11356", "11357", "11358", "11359", "11360", "11361", "11362", 
    "11363", "11364", "11365", "11366", "11367", "11368", "11369", "11370", "11372", 
    "11373", "11374", "11375", "11377", "11378", "11379", "11385", "11411", "11412", 
    "11413", "11414", "11415", "11416", "11417", "11418", "11419", "11420", "11421", 
    "11422", "11423", "11426", "11427", "11428", "11429", "11432", "11433", "11434", 
    "11435", "11436", "11691", "11692", "11693", "11694", "11697",
    "10301", "10302", "10303", "10304", "10305", "10306", "10307", 
    "10308", "10309", "10310", "10311", "10312", "10313", "10314"]
   
    selected_zipcode = request.args.get('zipcode')
    print(selected_zipcode)
    f=open("data/incomes by zipcode.json")
    data=json.load(f)
    f.close()
    zip_income=data["New York City"][selected_zipcode]
    inc_difference=abs(76607-zip_income)
    zip_percentile=get_percentile(zip_income)
    print(zip_percentile)
    for zipcode in zipcodes:
        zip_percentiles[zipcode]=get_percentile(zip_income)
        print(zip_percentiles)

   

    years, taxes_paid_endpoints, tax_shares, OG_Paid, New_Paid = generate_taxes_paid(zip_percentile)
    years, shares_endpoints, AGI_shares,OG_Share, New_Share = generate_AGI_share(zip_percentile)
    return render_template('micro.html', current_page='micro',zipcodes=zipcodes,zipcode=selected_zipcode,zip_income=zip_income,zip_percentile=zip_percentile,years=years,
                           taxes_paid_endpoints=taxes_paid_endpoints, tax_shares=tax_shares,shares_endpoints=shares_endpoints,AGI_shares=AGI_shares, inc_difference=inc_difference, OG_Paid=OG_Paid, New_Paid=New_Paid,OG_Share=OG_Share,New_Share=New_Share)





@app.route('/about')
def about():
    zipcodes = [
    "10001", "10002", "10003", "10004", "10005", "10006", "10007", "10009", "10010", 
    "10011", "10012", "10013", "10014", "10016", "10017", "10018", "10019", "10021", 
    "10022", "10023", "10024", "10025", "10026", "10027", "10028", "10029", "10030", 
    "10031", "10032", "10033", "10034", "10035", "10036", "10037", "10038", "10039", 
    "10040", "10044", "10069", "10065", "10075", "10103", "10119", "10128", "10162", 
    "10165", "10170", "10173", "10199", "10279", "10280", "10282", "10467", "10456", 
    "10458", "10453", "10468", "10457", "10452", "10469", "10462", "10466", "10463", 
    "10472", "10460", "10473", "10451", "10461", "10459", "10465", "10475", "10455", 
    "10454", "10471", "10474", "10470", "10803", "10464", "10499", "11201", "11206", 
    "11207", "11208", "11209", "11202", "11203", "11204", "11205", "11210", "11211", 
    "11212", "11213", "11218", "11219", "11220", "11221", "11222", "11223", "11224", 
    "11225", "11214", "11215", "11216", "11217", "11226", "11228", "11229", "11230", 
    "11235", "11236", "11237", "11238", "11245", "11247", "11249", "11256", "11231", 
    "11232", "11233", "11234", "11239", "11241", "11242", "11243", "11251", "11252", 
    "11004", "11101", "11102", "11103", "11104", "11105", "11106", "11109", "11351", 
    "11354", "11355", "11356", "11357", "11358", "11359", "11360", "11361", "11362", 
    "11363", "11364", "11365", "11366", "11367", "11368", "11369", "11370", "11372", 
    "11373", "11374", "11375", "11377", "11378", "11379", "11385", "11411", "11412", 
    "11413", "11414", "11415", "11416", "11417", "11418", "11419", "11420", "11421", 
    "11422", "11423", "11426", "11427", "11428", "11429", "11432", "11433", "11434", 
    "11435", "11436", "11691", "11692", "11693", "11694", "11697",
    "10301", "10302", "10303", "10304", "10305", "10306", "10307", 
    "10308", "10309", "10310", "10311", "10312", "10313", "10314"
]
    return render_template('about.html', current_page='about',zipcodes=zipcodes)



app.run(debug=True)

