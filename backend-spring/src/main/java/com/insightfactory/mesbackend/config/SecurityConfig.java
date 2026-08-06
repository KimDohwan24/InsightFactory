package com.insightfactory.mesbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // 비밀번호를 안전하게 암호화하기 위한 BCrypt Encoder 빈 등록
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 기본 시큐리티 설정 (개발 편의를 위해 일단 모든 접근 허용 및 CSRF 비활성화)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> {}) // WebMvcConfig 등의 전역 CORS 설정 사용
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() // 임시로 모든 경로 접근 허용
            );
        return http.build();
    }
}
