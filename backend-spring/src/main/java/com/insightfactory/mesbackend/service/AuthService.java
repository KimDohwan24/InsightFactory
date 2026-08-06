package com.insightfactory.mesbackend.service;

import com.insightfactory.mesbackend.dto.AuthResponse;
import com.insightfactory.mesbackend.dto.LoginRequest;
import com.insightfactory.mesbackend.entity.User;
import com.insightfactory.mesbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. DB에서 사용자 조회
        Optional<User> userOptional = userRepository.findByUsername(request.getUsername());

        // 2. 임시 하드코딩 처리 (DB에 유저가 아예 없을 경우 테스트용 어드민 계정을 자동 생성)
        // 실제 운영 환경에서는 회원가입 로직과 비밀번호 암호화(BCrypt)가 필수입니다.
        if (userOptional.isEmpty() && "admin".equals(request.getUsername())) {
            User newUser = new User();
            newUser.setUsername("admin");
            newUser.setPassword("1234"); // 비밀번호 암호화 생략 (임시)
            newUser.setRole("ADMIN");
            userRepository.save(newUser);
            userOptional = Optional.of(newUser);
        }

        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 사용자입니다.");
        }

        User user = userOptional.get();

        // 3. 비밀번호 확인
        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 4. 추후 JWT 연동 시 실제 토큰 발행 (지금은 Dummy 토큰 반환)
        String dummyToken = "jwt-token-dummy-1234";

        return new AuthResponse(dummyToken, user.getUsername(), user.getRole(), "로그인 성공");
    }
}
