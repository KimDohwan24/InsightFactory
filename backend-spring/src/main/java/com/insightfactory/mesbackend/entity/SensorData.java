package com.insightfactory.mesbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "sensor_data")
@Getter
@Setter
@NoArgsConstructor
public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_number", referencedColumnName = "lot_number", nullable = false)
    private ProductionLot productionLot;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // PostgreSQL의 JSONB 타입을 지원하기 위해 Hibernate 6 방식 적용
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> measurements;
}
