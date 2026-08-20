import requests

# login
res = requests.post("http://localhost:8000/auth/login", json={"email": "superadmin@mymedical.test", "password": "Test@12345"})
if res.status_code == 200:
    token = res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}", "X-Organization-ID": "7"}
    
    # get valid medicine
    res0 = requests.get("http://localhost:8000/sales/pos/medicines", headers=headers)
    med = res0.json()["data"]["items"][0]
    
    # create sale
    payload = {
        "discount_amount": 0,
        "payment_method": "cash",
        "items": [{"medicine_id": med["medicine_id"], "quantity": 1, "batch_id": med["batch_id"]}]
    }
    res = requests.post("http://localhost:8000/sales/create", json=payload, headers=headers)
    print("Create sale:", res.status_code, res.text)
    if res.status_code == 200 and res.json().get("data"):
        sale_id = res.json()["data"]["id"]
        
        # get invoice
        res2 = requests.get(f"http://localhost:8000/invoice/sale/{sale_id}", headers=headers)
        print("Get invoice:", res2.status_code, len(res2.content) if res2.status_code==200 else res2.text)
