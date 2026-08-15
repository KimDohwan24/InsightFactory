package com.insightfactory.mesbackend.repository;

import com.insightfactory.mesbackend.entity.ProductionLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionLotRepository extends JpaRepository<ProductionLot, String> {
    List<ProductionLot> findByStatus(String status);
}
