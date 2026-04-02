from django.test import TestCase
from .models import Stock


#Unit Test of Crud
class StockTestCase(TestCase):
    #Test for creation of stock, pass if successful, failed otherwise
    def test_create_stock(self):
        stock = Stock.objects.create(ticker="CHV", name="Chevron")
        self.assertEqual(stock.ticker, "CHV")
        self.assertEqual(stock.name, "Chevron")

    # Test to update stock's name and ticker
    # We then check if name = "TESLA" and if ticker = "TSLA"
    # If any of these checks failed, test fails, otherwise passes 
    # NOTE: Update was coded to fail on purpose
    def test_update_stock(self):
        stock = Stock.objects.create(ticker="TSLA", name="TESLA")
        stock.name = "TESLa cars" #This will fail the check
        stock.save()

        updated_stock = Stock.objects.get(pk=stock.pk)
        self.assertEqual(updated_stock.name, "Tesla motors")
        self.assertEqual(updated_stock.ticker, "TSLA")

    #Deletion of stock
    def test_delete_product(self):
        stock = Stock.objects.create(name="Delete Me", ticker="DEL")
        stock_id = stock.id
        stock.delete()

        with self.assertRaises(Stock.DoesNotExist):
            Stock.objects.get(id=stock_id)
