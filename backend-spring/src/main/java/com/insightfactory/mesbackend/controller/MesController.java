package com.insightfactory.mesbackend.controller;

import com.insightfactory.mesbackend.entity.ProductionLot;
import com.insightfactory.mesbackend.repository.ProductionLotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // React 클라이언트를 위한 CORS 오픈 (운영 시에는 특정 도메인만 허용하도록 수정)
public class MesController {

    private final ProductionLotRepository productionLotRepository;

    // 1. 대시보드에서 생산 중인 로트 목록 조회
    @GetMapping("/lots")
    public ResponseEntity<List<ProductionLot>> getProductionLots(@RequestParam(required = false) String status) {
        List<ProductionLot> lots;
        if (status != null) {
            lots = productionLotRepository.findByStatus(status);
        } else {
            lots = productionLotRepository.findAll();
        }
        return ResponseEntity.ok(lots);
    }

    // 2. AI 서버(FastAPI)로 예측을 요청하고 결과를 받아오는 기능 (추후 Service 계층에서 WebClient로 구현 예정)
    @PostMapping("/lots/{lotNumber}/predict")
    public ResponseEntity<String> predictQuality(@PathVariable String lotNumber) {
        // TODO: 1. DB에서 해당 lotNumber의 최신 센서 데이터(SensorData) 조회
        // TODO: 2. Spring WebClient를 이용해 FastAPI 서버(예: http://localhost:8000/predict)로 데이터 전송
        // TODO: 3. FastAPI 응답(불량 여부)을 받아 QualityPrediction 엔티티로 DB에 저장
        // TODO: 4. 최종 결과를 React 프론트엔드로 반환
        
        return ResponseEntity.ok("AI 모델 추론 요청 기능이 곧 구현될 예정입니다. 대상 로트: " + lotNumber);
    }
}
