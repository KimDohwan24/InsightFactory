using System;
using System.IO;
using System.Threading.Tasks;
using InsightFactory.Desktop.Models;

namespace InsightFactory.Desktop.Services
{
    public class DataSimulatorService
    {
        private readonly string _csvPath;
        private StreamReader _reader;
        private int _colProductId, _colYClass, _colYQuality, _colTimestamp, _colLine, _colProductCode, _colX1, _colX2;

        public DataSimulatorService()
        {
            // Set absolute path to the dataset for demo purposes
            _csvPath = @"C:\Users\김동건\Desktop\InsightFactory\backend\dataset\train.csv";
        }

        public async Task InitializeAsync()
        {
            if (!File.Exists(_csvPath))
            {
                throw new FileNotFoundException($"CSV file not found at {_csvPath}");
            }

            _reader = new StreamReader(_csvPath);
            string header = await _reader.ReadLineAsync();
            if (header == null) throw new Exception("Empty CSV");

            var headers = header.Split(',');
            _colProductId = Array.IndexOf(headers, "PRODUCT_ID");
            _colYClass = Array.IndexOf(headers, "Y_Class");
            _colYQuality = Array.IndexOf(headers, "Y_Quality");
            _colTimestamp = Array.IndexOf(headers, "TIMESTAMP");
            _colLine = Array.IndexOf(headers, "LINE");
            _colProductCode = Array.IndexOf(headers, "PRODUCT_CODE");
            _colX1 = Array.IndexOf(headers, "X_1");
            _colX2 = Array.IndexOf(headers, "X_2");
        }

        public async Task<FactoryData> GetNextDataAsync()
        {
            if (_reader == null) await InitializeAsync();
            if (_reader.EndOfStream)
            {
                // Restart simulation
                _reader.BaseStream.Position = 0;
                await _reader.ReadLineAsync(); // Skip header
            }

            string line = await _reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(line)) return null;

            var cols = line.Split(',');
            
            int.TryParse(cols[_colYClass], out int yClass);
            double.TryParse(cols[_colYQuality], out double yQuality);
            DateTime.TryParse(cols[_colTimestamp], out DateTime timestamp);
            
            double x1 = 0;
            if (_colX1 >= 0 && _colX1 < cols.Length) double.TryParse(cols[_colX1], out x1);

            double x2 = 0;
            if (_colX2 >= 0 && _colX2 < cols.Length) double.TryParse(cols[_colX2], out x2);

            return new FactoryData
            {
                ProductId = cols[_colProductId],
                YClass = yClass,
                YQuality = yQuality,
                Timestamp = timestamp,
                Line = cols[_colLine],
                ProductCode = cols[_colProductCode],
                X1 = x1,
                X2 = x2
            };
        }
    }
}
