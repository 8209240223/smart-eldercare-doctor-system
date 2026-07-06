package com.medical.controller;

import com.medical.common.constant.RedisKeyConstant;
import com.medical.common.result.R;
import com.medical.common.utils.RedisUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

/**
 * 验证码控制器（使用 Redis 分布式存储）
 */
@RestController
@RequestMapping("/api/auth")
public class CaptchaController {

    @Autowired
    private RedisUtils redisUtils;

    private static final Random RANDOM = new Random();

    /**
     * 生成验证码图片
     */
    @GetMapping("/captcha")
    public R<?> getCaptcha() {
        // 生成4位验证码
        String code = generateCode(4);
        String key = UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // 验证码存入 Redis，5分钟自动过期
        String redisKey = RedisKeyConstant.buildCaptchaKey(key);
        redisUtils.setWithSeconds(redisKey, code.toLowerCase(), RedisKeyConstant.CAPTCHA_TTL);

        // 生成图片
        String base64 = generateCaptchaImage(code);

        Map<String, String> result = new java.util.HashMap<>();
        result.put("key", key);
        result.put("image", "data:image/png;base64," + base64);
        return R.ok(result);
    }

    /**
     * 验证验证码（从 Redis 中获取并删除，确保一次性使用）
     */
    public static boolean verifyCaptcha(String key, String code) {
        // 注意：这里用静态方法调用 RedisUtils 需要通过 Spring 上下文
        // 实际通过 AuthController 调用，已改为非静态方式
        if (key == null || code == null) return false;
        return false;
    }

    /**
     * 验证码校验（实例方法，通过注入的 RedisUtils 操作 Redis）
     */
    public boolean verify(String key, String code) {
        if (key == null || code == null) return false;
        String redisKey = RedisKeyConstant.buildCaptchaKey(key);
        String stored = redisUtils.get(redisKey, String.class);
        if (stored != null && stored.equals(code.toLowerCase())) {
            // 验证成功后立即删除（一次性使用）
            redisUtils.delete(redisKey);
            return true;
        }
        return false;
    }

    private String generateCode(int length) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String generateCaptchaImage(String code) {
        int width = 130, height = 40;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // 背景
        g.setColor(new Color(245, 245, 245));
        g.fillRect(0, 0, width, height);

        // 干扰线
        for (int i = 0; i < 5; i++) {
            g.setColor(new Color(RANDOM.nextInt(200), RANDOM.nextInt(200), RANDOM.nextInt(200)));
            g.drawLine(RANDOM.nextInt(width), RANDOM.nextInt(height),
                    RANDOM.nextInt(width), RANDOM.nextInt(height));
        }

        // 干扰点
        for (int i = 0; i < 30; i++) {
            g.setColor(new Color(RANDOM.nextInt(255), RANDOM.nextInt(255), RANDOM.nextInt(255)));
            g.fillOval(RANDOM.nextInt(width), RANDOM.nextInt(height), 2, 2);
        }

        // 文字
        g.setFont(new Font("Arial", Font.BOLD, 28));
        for (int i = 0; i < code.length(); i++) {
            g.setColor(new Color(RANDOM.nextInt(100), RANDOM.nextInt(100), RANDOM.nextInt(100)));
            // 随机旋转
            double theta = (RANDOM.nextDouble() - 0.5) * 0.3;
            g.rotate(theta, 25 + i * 28, 28);
            g.drawString(String.valueOf(code.charAt(i)), 15 + i * 28, 30);
            g.rotate(-theta, 25 + i * 28, 28);
        }

        g.dispose();

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            return "";
        }
    }
}
