package com.insightfactory.mesbackend.service;

import com.insightfactory.mesbackend.dto.AuthResponse;
import com.insightfactory.mesbackend.dto.LoginRequest;
import com.insightfactory.mesbackend.entity.User;
import com.insightfactory.mesbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // BCrypt 주입

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. DB에서 사용자 조회
        Optional<User> userOptional = userRepository.findByUsername(request.getUsername());

        // 2. 유저가 없을 경우 테스트용 어드민 계정을 자동 생성 (비밀번호 BCrypt 암호화 적용)
        if (userOptional.isEmpty() && "admin".equals(request.getUsername())) {
            User newUser = new User();
            newUser.setUsername("admin");
            newUser.setPassword(passwordEncoder.encode("1234")); // BCrypt로 암호화하여 저장
            newUser.setRole("ADMIN");
            userRepository.save(newUser);
            userOptional = Optional.of(newUser);
        }

        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 사용자입니다.");
        }

        User user = userOptional.get();

        // 3. 비밀번호 확인 (BCrypt matches 사용)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 4. 추후 JWT 연동 시 실제 토큰 발행 (지금은 Dummy 토큰 반환)
        String dummyToken = "jwt-token-dummy-1234";

        return new AuthResponse(dummyToken, user.getUsername(), user.getRole(), "로그인 성공");
    }
}
