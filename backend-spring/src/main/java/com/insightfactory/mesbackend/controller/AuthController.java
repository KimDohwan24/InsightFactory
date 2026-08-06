package com.insightfactory.mesbackend.controller;

import com.insightfactory.mesbackend.dto.AuthResponse;
import com.insightfactory.mesbackend.dto.LoginRequest;
import com.insightfactory.mesbackend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // CORS 허용
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // 로그인 실패 시 401 Unauthorized 또는 400 반환
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // 현재는 JWT 기반 Stateless 인증이므로 서버에서 세션을 파기할 필요가 없습니다.
        // 추후 Redis 기반 Refresh Token을 도입할 경우, 여기서 토큰을 무효화(블랙리스트) 처리합니다.
        return ResponseEntity.ok("로그아웃 되었습니다. 클라이언트 측에서 토큰을 삭제해 주세요.");
    }
}
