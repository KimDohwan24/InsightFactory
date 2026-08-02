using CommunityToolkit.Mvvm.ComponentModel;

namespace InsightFactory.Desktop.Models
{
    public partial class ProductModel : ObservableObject
    {
        [ObservableProperty] private string _code;
        [ObservableProperty] private string _revision;

        public ProductModel()
        {
            _code = "";
            _revision = "";
        }
    }
}
