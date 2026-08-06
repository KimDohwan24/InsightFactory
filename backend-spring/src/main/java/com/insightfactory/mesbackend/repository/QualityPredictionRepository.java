package com.insightfactory.mesbackend.repository;

import com.insightfactory.mesbackend.entity.QualityPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QualityPredictionRepository extends JpaRepository<QualityPrediction, Long> {
    Optional<QualityPrediction> findByProductionLotLotNumber(String lotNumber);
}
