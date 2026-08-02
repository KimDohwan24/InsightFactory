using System;

namespace InsightFactory.Desktop.Models
{
    public class FactoryData
    {
        public string ProductId { get; set; }
        public int YClass { get; set; }
        public double YQuality { get; set; }
        public DateTime Timestamp { get; set; }
        public string Line { get; set; }
        public string ProductCode { get; set; }
        
        public double X1 { get; set; }
        public double X2 { get; set; }
    }
}
