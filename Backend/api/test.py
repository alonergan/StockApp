from django.test import TestCase
from .models import Stock

class StockTestCase(TestCase):
    def test_create_stock(self):
        ticker = Stock.objects.create(ticker="CHV", name="Chevron")
        self.assertEqual(ticker.ticker, "CHV")
        self.assertEqual(ticker.name, "Chevron")

    def test_update_stock(self):
        ticker = Stock.objects.create(ticker="TSLA", name="TESLA")
        ticker.name = "TESLA"
        ticker.ticker = "TSLA"
        ticker.save()

        updated_ticker = Stock.objects.get(pk=ticker.pk)
        self.assertEqual(updated_ticker.name, "TESLA")
        self.assertEqual(updated_ticker.ticker, "TLSA")

    def test_delete_product(self):
        ticker = Stock.objects.create(name="Delete Me", ticker="")
        ticker.delete()

        with self.assertRaises(Stock.DoesNotExist):
            Stock.objects.get(name="Delete Me")