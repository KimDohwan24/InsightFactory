using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CommunityToolkit.Mvvm.Messaging;
using InsightFactory.Desktop.Models;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows;

namespace InsightFactory.Desktop.ViewModels
{
    public partial class ProductManagementViewModel : ObservableObject
    {
        public ObservableCollection<ProductModel> Products { get; } = new ObservableCollection<ProductModel>();

        [ObservableProperty]
        private ProductModel? _selectedProduct;

        // Input Fields
        [ObservableProperty] private string _inputCode = "";
        [ObservableProperty] private string _inputRevision = "";

        public ProductManagementViewModel()
        {
            // Dummy Data
            Products.Add(new ProductModel { Code = "A_31", Revision = "v1.0" });
            Products.Add(new ProductModel { Code = "T_31", Revision = "v2.1" });
            Products.Add(new ProductModel { Code = "O_31", Revision = "v1.5" });
        }

        partial void OnSelectedProductChanged(ProductModel? value)
        {
            if (value != null)
            {
                InputCode = value.Code;
                InputRevision = value.Revision;
            }
        }

        [RelayCommand]
        private void AddProduct()
        {
            if (string.IsNullOrWhiteSpace(InputCode))
            {
                MessageBox.Show("Code is required.", "Validation Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            if (Products.Any(p => p.Code == InputCode))
            {
                MessageBox.Show("A product with this Code already exists.", "Validation Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            Products.Add(new ProductModel
            {
                Code = InputCode,
                Revision = InputRevision
            });

            WeakReferenceMessenger.Default.Send(new ProductAddedMessage(InputCode));

            ClearForm();
        }

        [RelayCommand]
        private void UpdateProduct()
        {
            if (SelectedProduct == null) return;

            SelectedProduct.Code = InputCode;
            SelectedProduct.Revision = InputRevision;

            SelectedProduct = null;
            ClearForm();
        }

        [RelayCommand]
        private void DeleteProduct()
        {
            if (SelectedProduct != null)
            {
                var code = SelectedProduct.Code;
                Products.Remove(SelectedProduct);
                WeakReferenceMessenger.Default.Send(new ProductDeletedMessage(code));
                SelectedProduct = null;
                ClearForm();
            }
        }

        [RelayCommand]
        private void ClearForm()
        {
            InputCode = "";
            InputRevision = "";
            SelectedProduct = null;
        }
    }
}
