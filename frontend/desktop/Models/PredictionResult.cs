using System;

namespace InsightFactory.Desktop.Models
{
    public class PredictionResult
    {
        public bool IsDefective { get; set; }
        public double Confidence { get; set; }
        public string Message { get; set; }
    }
}
