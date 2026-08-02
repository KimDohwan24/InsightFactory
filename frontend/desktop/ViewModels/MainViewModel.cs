using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using InsightFactory.Desktop.Models;
using InsightFactory.Desktop.Services;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Painting;
using LiveChartsCore.Defaults;
using SkiaSharp;
using System;
using System.Collections.ObjectModel;
using System.Windows.Threading;
using System.Windows.Media;
using System.Threading.Tasks;
using System.Linq;
using CommunityToolkit.Mvvm.Messaging;

namespace InsightFactory.Desktop.ViewModels
{
    public partial class LineInfo : ObservableObject
    {
        [ObservableProperty] private string _name = "";
        [ObservableProperty] private string _status = "대기 중";
        [ObservableProperty] private Brush _statusColor = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#FFC107"));
    }

    public partial class ProductInfo : ObservableObject
    {
        [ObservableProperty] private string _productCode = "";
        [ObservableProperty] private int _totalCount = 0;
        [ObservableProperty] private int _defectCount = 0;
        
        public double DefectRate => TotalCount == 0 ? 0.0 : Math.Round((double)DefectCount / TotalCount * 100, 2);
        
        public void Update(bool isDefect)
        {
            TotalCount++;
            if (isDefect) DefectCount++;
            OnPropertyChanged(nameof(DefectRate));
        }
    }

    public partial class MainViewModel : ObservableObject
    {
        private readonly DispatcherTimer _timer;
        private readonly DataSimulatorService _dataService;
        private int _xIndex = 0;

        // KPIs
        [ObservableProperty] private int _totalProduction = 0;
        [ObservableProperty] private double _defectRate = 0.0;
        [ObservableProperty] private double _averageQuality = 0.0;
        [ObservableProperty] private string _aiPredictionStatus = "-";

        private static readonly BrushConverter _brushConverter = new BrushConverter();

        // Lines
        public ObservableCollection<LineInfo> Lines { get; } = new ObservableCollection<LineInfo>();

        // Navigation
        [ObservableProperty] private int _currentTabIndex = 0;

        [RelayCommand]
        private void SwitchTab(string indexStr)
        {
            if (int.TryParse(indexStr, out int index))
            {
                CurrentTabIndex = index;
            }
        }

        // Products
        public ObservableCollection<ProductInfo> Products { get; } = new ObservableCollection<ProductInfo>();

        // Charts
        public ObservableCollection<ObservablePoint> QualitySeries { get; set; } = new ObservableCollection<ObservablePoint>();
        public ObservableCollection<ObservablePoint> SensorSeries { get; set; } = new ObservableCollection<ObservablePoint>();

        public ISeries[] QualityChartSeries { get; set; }
        public ISeries[] SensorChartSeries { get; set; }

        // AI Results
        public ObservableCollection<string> AiResults { get; set; } = new ObservableCollection<string>();

        private int _defectCount = 0;
        private double _qualitySum = 0.0;
        private int _qualityCount = 0;

        public MainViewModel()
        {
            _dataService = new DataSimulatorService();

            var lineNames = new[] { "T050304", "T050307", "T100304", "T100306", "T010306", "T010305" };
            foreach (var name in lineNames)
            {
                Lines.Add(new LineInfo { Name = name });
            }

            var productCodes = new[] { "A_31", "T_31", "O_31" };
            foreach (var code in productCodes)
            {
                Products.Add(new ProductInfo { ProductCode = code });
            }

            WeakReferenceMessenger.Default.Register<ProductAddedMessage>(this, (r, m) =>
            {
                System.Windows.Application.Current.Dispatcher.Invoke(() =>
                {
                    if (!Products.Any(p => p.ProductCode == m.ProductCode))
                    {
                        Products.Add(new ProductInfo { ProductCode = m.ProductCode });
                    }
                });
            });

            WeakReferenceMessenger.Default.Register<ProductDeletedMessage>(this, (r, m) =>
            {
                System.Windows.Application.Current.Dispatcher.Invoke(() =>
                {
                    var product = Products.FirstOrDefault(p => p.ProductCode == m.ProductCode);
                    if (product != null)
                    {
                        Products.Remove(product);
                    }
                });
            });

            QualityChartSeries = new ISeries[]
            {
                new LineSeries<ObservablePoint>
                {
                    Values = QualitySeries,
                    Name = "품질 지수 (Y_Quality)",
                    GeometrySize = 0,
                    Stroke = new SolidColorPaint(SKColors.DodgerBlue) { StrokeThickness = 2 },
                    Fill = new SolidColorPaint(SKColors.DodgerBlue.WithAlpha(50))
                }
            };

            SensorChartSeries = new ISeries[]
            {
                new LineSeries<ObservablePoint>
                {
                    Values = SensorSeries,
                    Name = "공정 센서 (X_1)",
                    GeometrySize = 0,
                    Stroke = new SolidColorPaint(SKColors.Crimson) { StrokeThickness = 2 },
                    Fill = new SolidColorPaint(SKColors.Crimson.WithAlpha(50))
                }
            };

            _timer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(1.0)
            };
            _timer.Tick += async (s, e) => await UpdateMockDataAsync();
            
            _timer.Start();
        }

        private async Task UpdateMockDataAsync()
        {
            try
            {
                var data = await _dataService.GetNextDataAsync();
                if (data == null) return;

                TotalProduction++;

                bool isNormal = (data.YClass == 1);
                if (!isNormal) _defectCount++;

                DefectRate = Math.Round((double)_defectCount / TotalProduction * 100, 2);

                _qualitySum += data.YQuality;
                _qualityCount++;
                AverageQuality = Math.Round(_qualitySum / _qualityCount, 4);

                QualitySeries.Add(new ObservablePoint(_xIndex, data.YQuality));
                if (QualitySeries.Count > 30) QualitySeries.RemoveAt(0);

                SensorSeries.Add(new ObservablePoint(_xIndex, data.X1));
                if (SensorSeries.Count > 30) SensorSeries.RemoveAt(0);

                _xIndex++;

                string statusText = isNormal ? "정상" : $"불량 (Class {data.YClass})";
                AiPredictionStatus = statusText;
                
                AiResults.Insert(0, $"[{data.ProductCode}] {data.ProductId} → {statusText}");
                if (AiResults.Count > 15) AiResults.RemoveAt(AiResults.Count - 1);

                // Update Line Statuses
                foreach (var line in Lines)
                {
                    if (line.Name == data.Line)
                    {
                        line.Status = "가동 중";
                        line.StatusColor = (Brush)_brushConverter.ConvertFromString("#4CAF50");
                    }
                    else
                    {
                        line.Status = "대기 중";
                        line.StatusColor = (Brush)_brushConverter.ConvertFromString("#FFC107");
                    }
                }

                // Update Product Stats
                var product = Products.FirstOrDefault(p => p.ProductCode == data.ProductCode);
                if (product != null)
                {
                    product.Update(!isNormal);
                }
            }
            catch (Exception ex)
            {
                AiResults.Insert(0, $"Error: {ex.Message}");
            }
        }
    }
}
