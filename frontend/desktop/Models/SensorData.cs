using System;

namespace InsightFactory.Desktop.Models
{
    public class SensorData
    {
        public DateTime Timestamp { get; set; }
        public double Temperature { get; set; }
        public double Vibration { get; set; }
        public double Pressure { get; set; }
    }
}
