import logging, requests, json
from django.core.management.base import BaseCommand, CommandError

class Command(BaseCommand):
    URL = 'http://mob.tpj.co.jp/mob/api/records/121'
    FILE = 'app/fixtures/initial_data.json'

    def handle(self, *args, **options):
        try:
            od = requests.get(self.URL).json()
            f = open(self.FILE, 'w')
            #  json.dump(od['results'], f, ensure_ascii=False)
            f.close
        except:
            print('Failed to get opendata')
