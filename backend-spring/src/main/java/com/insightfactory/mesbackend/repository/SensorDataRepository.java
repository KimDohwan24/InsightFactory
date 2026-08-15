package com.insightfactory.mesbackend.repository;

import com.insightfactory.mesbackend.entity.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
    List<SensorData> findByProductionLotLotNumberOrderByTimestampDesc(String lotNumber);
}
