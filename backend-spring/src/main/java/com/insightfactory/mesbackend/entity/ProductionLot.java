package com.insightfactory.mesbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "production_lots")
@Getter
@Setter
@NoArgsConstructor
public class ProductionLot {

    @Id
    @Column(name = "lot_number", nullable = false, unique = true)
    private String lotNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(nullable = false)
    private String status; // e.g., IN_PROGRESS, COMPLETED, INSPECTING
}
