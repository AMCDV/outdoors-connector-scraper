import requests
import json
from datetime import datetime, timedelta

cookies = {
    'renderCtx': '%7B%22pageId%22%3A%223e01151f-cdd6-4058-af41-906813477461%22%2C%22schema%22%3A%22Published%22%2C%22viewType%22%3A%22Published%22%2C%22brandingSetId%22%3A%22457e5b18-486f-4d74-97c2-cc6e6662c03a%22%2C%22audienceIds%22%3A%226AuUN0000001lD2%2C6AuUN0000001lD1%2C6AuUN0000002FMN%22%7D',
    'CookieConsentPolicy': '0:1',
    'LSKey-c$CookieConsentPolicy': '0:1',
    'pctrk': '843a204b-8e06-4e18-b893-eb4e4b616028',
    '_gcl_au': '1.1.1317254722.1750805931',
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    # 'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Referer': 'https://activities.outdoors.org/',
    'X-SFDC-LDS-Endpoints': 'ApexActionController.execute:OC_ActivitySearchController.searchForActivitiesApplyFilters',
    'X-SFDC-Page-Scope-Id': 'd188486d-32f1-41ed-8594-51b92a3349b6',
    'X-SFDC-Request-Id': '2218902000000f217e',
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'X-B3-TraceId': '92ad774e97511890',
    'X-B3-SpanId': '23f721a599592d41',
    'X-B3-Sampled': '0',
    'Origin': 'https://activities.outdoors.org',
    'DNT': '1',
    'Connection': 'keep-alive',
    # 'Cookie': 'renderCtx=%7B%22pageId%22%3A%223e01151f-cdd6-4058-af41-906813477461%22%2C%22schema%22%3A%22Published%22%2C%22viewType%22%3A%22Published%22%2C%22brandingSetId%22%3A%22457e5b18-486f-4d74-97c2-cc6e6662c03a%22%2C%22audienceIds%22%3A%226AuUN0000001lD2%2C6AuUN0000001lD1%2C6AuUN0000002FMN%22%7D; CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1; pctrk=843a204b-8e06-4e18-b893-eb4e4b616028; _gcl_au=1.1.1317254722.1750805931',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-GPC': '1',
    'Priority': 'u=0',
}

data = 'message=%7B%22actions%22%3A%5B%7B%22id%22%3A%22425%3Ba%22%2C%22descriptor%22%3A%22aura%3A%2F%2FApexActionController%2FACTION%24execute%22%2C%22callingDescriptor%22%3A%22UNKNOWN%22%2C%22params%22%3A%7B%22namespace%22%3A%22%22%2C%22classname%22%3A%22OC_ActivitySearchController%22%2C%22method%22%3A%22searchForActivitiesApplyFilters%22%2C%22params%22%3A%7B%22filtersJsonSpecs%22%3A%22%7B%5C%22location%5C%22%3A%7B%5C%22latitude%5C%22%3A0%2C%5C%22longitude%5C%22%3A0%2C%5C%22radius%5C%22%3A100%2C%5C%22address%5C%22%3A%5C%22%5C%22%7D%2C%5C%22additionalFilters%5C%22%3A%7B%5C%22audiences%5C%22%3A%5C%22--all--%5C%22%2C%5C%22programTypes%5C%22%3A%5C%22--all--%5C%22%2C%5C%22openForRegistration%5C%22%3Afalse%2C%5C%22noCostTrips%5C%22%3Afalse%2C%5C%22chapters%5C%22%3A%5C%220015000001Sg06BAAR%5C%22%7D%7D%22%7D%2C%22cacheable%22%3Afalse%2C%22isContinuation%22%3Afalse%7D%7D%5D%7D^&aura.context=%7B%22mode%22%3A%22PROD%22%2C%22fwuid%22%3A%22VXlnM1FET1BLV0NVVUNZMW9MNmU3UWdLNVAwNUkzRVNnOFJ1eVRYdHBvVVExMi42MjkxNDU2LjE2Nzc3MjE2%22%2C%22app%22%3A%22siteforce%3AcommunityApp%22%2C%22loaded%22%3A%7B%22APPLICATION%40markup%3A%2F%2Fsiteforce%3AcommunityApp%22%3A%221296_E-0fs7eMs-UxUK_92StDMQ%22%7D%2C%22dn%22%3A%5B%5D%2C%22globals%22%3A%7B%7D%2C%22uad%22%3Atrue%7D^&aura.pageURI=%2Fs%2F%3Fchapters%3D0015000001Sg06BAAR^&aura.token=null'

def get_events():
    response = requests.post(
        'https://activities.outdoors.org/s/sfsites/aura?r=135^&aura.ApexAction.execute=1',
        cookies=cookies,
        headers=headers,
        data=data,
        )
    return response

def format_events(response):
    response_json = json.loads(response.content)
    actions = response_json["actions"]

    actions_data = actions[0]['returnValue']['returnValue']
    
    events = []

    for event in actions_data:

        start_date = datetime.strptime(event['Start_Date__c'], '%Y-%m-%d').date()
        end_date = datetime.strptime(event['End_Date__c'], '%Y-%m-%d').date()


        if start_date != end_date:
            print(end_date)
            end_date = end_date + timedelta(days=1)
            print(end_date)

        events.append({
            'title': event['Activity_Name__c'],
            'start_date': start_date,
            'end_date': end_date,
            'url': 'https://activities.outdoors.org/s/oc-activity/' + event['Id'],
            'description': event['Description__c'].replace('\n', ' ')
        })
    
    return events