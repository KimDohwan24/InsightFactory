package com.insightfactory.mesbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {
    private String token; // 추후 JWT 토큰 발급 시 사용
    private String username;
    private String role;
    private String message;
}
