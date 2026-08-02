using System;
using System.Threading.Tasks;
using InsightFactory.Desktop.Models;

namespace InsightFactory.Desktop.Services
{
    public class ApiService
    {
        private readonly Random _random = new Random();

        // Simulate fetching sensor data
        public async Task<SensorData> GetLatestSensorDataAsync()
        {
            await Task.Delay(300); // Simulate network delay
            return new SensorData
            {
                Timestamp = DateTime.Now,
                Temperature = 60 + _random.NextDouble() * 20, // 60 to 80
                Vibration = 1 + _random.NextDouble() * 5, // 1 to 6
                Pressure = 100 + _random.NextDouble() * 10 // 100 to 110
            };
        }

        // Simulate getting prediction result
        public async Task<PredictionResult> GetPredictionAsync(SensorData data)
        {
            await Task.Delay(200);
            
            // Dummy logic: if temp > 75 and vibration > 4, defective
            bool isDefective = data.Temperature > 75 && data.Vibration > 4;
            
            return new PredictionResult
            {
                IsDefective = isDefective,
                Confidence = 0.75 + _random.NextDouble() * 0.2,
                Message = isDefective ? "Abnormal conditions detected." : "Normal operation."
            };
        }
    }
}
