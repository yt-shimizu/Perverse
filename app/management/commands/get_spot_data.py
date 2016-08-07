import logging, requests, json
from django.core.management.base import BaseCommand, CommandError

class Command(BaseCommand):
    URL = 'http://mob.tpj.co.jp/mob/api/records/121'
    FILE = 'app/fixtures/initial_data.json'

    def handle(self, *args, **options):
            data = requests.get(self.URL).json()
            f = open(self.FILE, 'w')
            json.dump(self._format(data['results']), f, ensure_ascii=False)
            f.close

    def _format(self, obj):
        ary = []
        for i, o in enumerate(obj):
            ary.append({
                "fields": {
                    "description": o['説明'],
                    "lat": float(o['場所'][0]),
                    "long": float(o['場所'][1]),
                    "name": o['名称']
                },
                "model": "app.spot",
                "pk": i + 1
            })
        return ary

