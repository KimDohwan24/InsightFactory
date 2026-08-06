package com.insightfactory.mesbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "quality_predictions")
@Getter
@Setter
@NoArgsConstructor
public class QualityPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_number", referencedColumnName = "lot_number", nullable = false)
    private ProductionLot productionLot;

    @Column(name = "is_defective", nullable = false)
    private Boolean isDefective;

    @Column(name = "confidence_score")
    private Float confidenceScore;

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
