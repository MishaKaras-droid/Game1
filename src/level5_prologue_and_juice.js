import * as THREE from 'three';

/**
 * 1. КОНТРОЛЛЕР "СОЧНОГО" УПРАВЛЕНИЯ (GAME FEEL / JUICE)
 * Отвечает за плавное перестроение с наклоном, деформацию модели (Squash & Stretch),
 * подкат (Slide), удар с размаху вниз (Ground Pound), цепную атаку (Homing Chain)
 * и динамическую камеру (FOV Kick + Camera Shake).
 */
export class DuckJuiceController {
    constructor(duckMesh, camera) {
        this.duck = duckMesh;
        this.camera = camera;

        // Полосы движения
        this.lanes = [-3, 0, 3];
        this.currentLane = 1;

        // Физика прыжка и гравитации
        this.velocityY = 0;
        this.gravity = -45;
        this.jumpForce = 18;
        this.isGrounded = true;
        this.groundY = 0;

        // Буфер прыжка
        this.jumpBufferTimer = 0;
        this.jumpBufferDuration = 0.15;

        // Подкат (Slide)
        this.isSliding = false;
        this.slideTimer = 0;
        this.slideDuration = 0.7;

        // Удар с размаху вниз (Ground Pound)
        this.isGroundPounding = false;

        // Цепная атака в прыжке (Homing Chain)
        this.isHoming = false;
        this.homingTarget = null;
        this.homingSpeed = 38;
        this.homingCombo = 0;

        // Деформация модели (Squash & Stretch)
        this.targetScale = new THREE.Vector3(1, 1, 1);

        // Камера (FOV и тряска)
        this.baseFov = camera.fov || 60;
        this.boostFov = this.baseFov + 15;
        this.isBoosting = false;
        this.shakeIntensity = 0;
        this.baseCameraPos = camera.position.clone();
    }

    moveLeft() {
        if (this.isHoming) return;
        if (this.currentLane > 0) this.currentLane--;
    }

    moveRight() {
        if (this.isHoming) return;
        if (this.currentLane < this.lanes.length - 1) this.currentLane++;
    }

    jump(enemies = []) {
        if (this.isGrounded) {
            this.jumpBufferTimer = this.jumpBufferDuration;
        } else if (!this.isHoming && enemies.length > 0) {
            // Попытка выполнить цепную атаку (Homing Chain) по ближайшему врагу в воздухе
            this._tryHomingAttack(enemies);
        }
    }

    slide() {
        if (this.isHoming) return;

        if (this.isGrounded && !this.isSliding) {
            this.isSliding = true;
            this.slideTimer = this.slideDuration;
            this.targetScale.set(1.3, 0.5, 1.3);
        } else if (!this.isGrounded && !this.isGroundPounding) {
            // Удар с размаху вниз (Ground Pound)
            this.isGroundPounding = true;
            this.velocityY = -42;
            this.targetScale.set(0.8, 1.35, 0.8);
        }
    }

    setBoost(active) {
        this.isBoosting = active;
    }

    triggerCameraShake(intensity = 0.4) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    _tryHomingAttack(enemies) {
        let bestTarget = null;
        let minDist = 14; // Максимальная дистанция захвата цели

        for (const enemy of enemies) {
            if (!enemy || !enemy.position) continue;
            // Враг должен быть впереди утки (по оси -Z)
            const dz = this.duck.position.z - enemy.position.z;
            if (dz > 0.5 && dz < minDist) {
                const dist = this.duck.position.distanceTo(enemy.position);
                if (dist < minDist) {
                    minDist = dist;
                    bestTarget = enemy;
                }
            }
        }

        if (bestTarget) {
            this.isHoming = true;
            this.homingTarget = bestTarget;
            this.isGroundPounding = false;
            this.targetScale.set(0.75, 0.75, 1.35);
        }
    }

    update(dt, onEnemyHit = null, onGroundPoundLand = null) {
        const delta = Math.min(dt, 0.05);

        if (this.isHoming && this.homingTarget) {
            this._updateHoming(delta, onEnemyHit);
        } else {
            this._updateHorizontal(delta);
            this._updateVerticalAndSlide(delta, onGroundPoundLand);
        }

        this._updateJuiceEffects(delta);
    }

    _updateHoming(dt, onEnemyHit) {
        const targetPos = this.homingTarget.position.clone();
        targetPos.y += 0.8;

        const dir = targetPos.sub(this.duck.position);
        const dist = dir.length();

        if (dist < 1.0) {
            // Попадание по врагу!
            this.isHoming = false;
            this.homingCombo++;
            this.velocityY = 12; // Отскок вверх для продолжения цепочки
            this.duck.scale.set(1.3, 0.7, 1.3);
            this.targetScale.set(1, 1, 1);
            this.triggerCameraShake(0.35);

            // Выравниваем полосу под позицию врага
            let closestLane = 1;
            let minLaneDiff = Infinity;
            this.lanes.forEach((lx, idx) => {
                const diff = Math.abs(this.duck.position.x - lx);
                if (diff < minLaneDiff) {
                    minLaneDiff = diff;
                    closestLane = idx;
                }
            });
            this.currentLane = closestLane;

            if (onEnemyHit) onEnemyHit(this.homingTarget, this.homingCombo);
            this.homingTarget = null;
        } else {
            dir.normalize();
            this.duck.position.addScaledVector(dir, this.homingSpeed * dt);
        }
    }

    _updateHorizontal(dt) {
        const targetX = this.lanes[this.currentLane];
        const prevX = this.duck.position.x;

        this.duck.position.x = THREE.MathUtils.lerp(prevX, targetX, 15 * dt);

        const speedX = (this.duck.position.x - prevX) / dt;
        const targetTiltZ = THREE.MathUtils.clamp(-speedX * 0.035, -0.45, 0.45);
        this.duck.rotation.z = THREE.MathUtils.lerp(this.duck.rotation.z, targetTiltZ, 12 * dt);
    }

    _updateVerticalAndSlide(dt, onGroundPoundLand) {
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= dt;
            if (this.isGrounded) {
                this._executeJump();
                this.jumpBufferTimer = 0;
            }
        }

        if (this.isSliding) {
            this.slideTimer -= dt;
            this.duck.rotation.x = THREE.MathUtils.lerp(this.duck.rotation.x, -0.4, 15 * dt);
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.targetScale.set(1, 1, 1);
            }
        } else {
            this.duck.rotation.x = THREE.MathUtils.lerp(this.duck.rotation.x, 0, 15 * dt);
        }

        if (!this.isGrounded) {
            this.velocityY += this.gravity * dt;
            this.duck.position.y += this.velocityY * dt;

            if (this.duck.position.y <= this.groundY) {
                this.duck.position.y = this.groundY;
                this.isGrounded = true;
                this.homingCombo = 0;

                if (this.isGroundPounding) {
                    this.isGroundPounding = false;
                    this.triggerCameraShake(0.55);
                    if (onGroundPoundLand) onGroundPoundLand(this.duck.position.clone());
                }

                this.velocityY = 0;

                if (!this.isSliding) {
                    this.duck.scale.set(1.3, 0.7, 1.3);
                    this.targetScale.set(1, 1, 1);
                }
            }
        }
    }

    _executeJump() {
        this.isGrounded = false;
        this.isSliding = false;
        this.isGroundPounding = false;
        this.velocityY = this.jumpForce;

        this.duck.scale.set(0.8, 1.25, 0.8);
        this.targetScale.set(1, 1, 1);
    }

    _updateJuiceEffects(dt) {
        this.duck.scale.lerp(this.targetScale, 14 * dt);

        const desiredFov = this.isBoosting ? this.boostFov : this.baseFov;
        if (Math.abs(this.camera.fov - desiredFov) > 0.05) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, desiredFov, 8 * dt);
            this.camera.updateProjectionMatrix();
        }

        if (this.shakeIntensity > 0.001) {
            const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
            const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.set(
                this.baseCameraPos.x + offsetX,
                this.baseCameraPos.y + offsetY,
                this.baseCameraPos.z
            );
            this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, 0, 12 * dt);
        } else {
            this.camera.position.copy(this.baseCameraPos);
        }
    }
}

/**
 * 2. АНИМИРОВАННЫЙ КОМИКС-ПРОЛОГ (HTML + CSS + SVG)
 * Показывает 3 слайда из assets/slide1.svg, slide2.svg, slide3.svg
 * Слайд может нести вместо картинки (img) встроенную SVG-разметку (svg) — так сделан пролог уровня 6.
 * с плавным наездом камеры, тряской экрана и всплывающим текстом.
 */
export class PrologueComicOverlay {
    constructor({ slides = null, onComplete = null } = {}) {
        this.onComplete = onComplete;
        this.currentSlide = 0;
        this.slidesData = slides || [
            {
                img: 'assets/slide1.svg',
                text: 'Кря! Ожившая Диссертация повержена! Можно спокойно допить раф и отдохнуть...',
                shake: false
            },
            {
                img: 'assets/slide2.svg',
                text: 'Вот беда! Без учёбы город резко деградировал: студенты бросили пары и превратились в зомби!',
                shake: true
            },
            {
                img: 'assets/slide3.svg',
                text: 'Путь перекрыл Академический Тролль! Используй подкат и удар сверху, чтобы вернуть городу разум!',
                shake: true
            }
        ];

        this.overlay = null;
        this._injectStyles();
    }

    _injectStyles() {
        if (document.getElementById('prologue-comic-styles')) return;
        const style = document.createElement('style');
        style.id = 'prologue-comic-styles';
        style.textContent = `
            #prologue-overlay {
                position: fixed; inset: 0; background: #141622; color: #fff;
                font-family: 'Segoe UI', Roboto, sans-serif;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                z-index: 9999; overflow: hidden; user-select: none;
            }
            .comic-frame {
                position: relative; width: min(90vw, 720px); height: min(65vh, 420px);
                border: 4px solid #fff; border-radius: 16px;
                box-shadow: 0 12px 40px rgba(0,0,0,0.7); overflow: hidden; background: #222639;
            }
            .comic-slide {
                position: absolute; inset: 0; opacity: 0; pointer-events: none; transition: opacity 0.4s ease;
            }
            .comic-slide.active { opacity: 1; pointer-events: auto; }
            .comic-slide.active img, .comic-slide.active .comic-art { animation: kenBurnsPrologue 6s ease-out forwards; }
            .comic-art { position: absolute; inset: 0; }
            .comic-art > svg { width: 100%; height: 100%; display: block; }
            .comic-slide:not(.active) .comic-art * { animation-play-state: paused !important; }
            @keyframes kenBurnsPrologue {
                0% { transform: scale(1) translate(0, 0); }
                100% { transform: scale(1.12) translate(-1%, -2%); }
            }
            .comic-shake { animation: screenShakePrologue 0.4s ease-in-out 0.2s; }
            @keyframes screenShakePrologue {
                0%, 100% { transform: translate(0, 0); }
                20% { transform: translate(-8px, 6px); }
                40% { transform: translate(8px, -6px); }
                60% { transform: translate(-6px, -4px); }
                80% { transform: translate(6px, 4px); }
            }
            .comic-bubble {
                position: absolute; bottom: 18px; left: 18px; right: 18px;
                background: #fff; color: #111; padding: 14px 20px; border-radius: 14px;
                border: 3px solid #111; font-size: clamp(15px, 2.5vw, 19px); font-weight: 700;
                box-shadow: 4px 4px 0 #000; transform: translateY(20px); opacity: 0;
            }
            .comic-slide.active .comic-bubble {
                animation: popBubblePrologue 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) 0.25s forwards;
            }
            @keyframes popBubblePrologue { to { transform: translateY(0); opacity: 1; } }
            .comic-controls { margin-top: 18px; display: flex; gap: 14px; align-items: center; }
            .comic-btn {
                background: #ffcc00; color: #111; border: 3px solid #111; padding: 10px 24px;
                font-size: 16px; font-weight: 800; border-radius: 12px; cursor: pointer;
                box-shadow: 0 4px 0 #111; transition: transform 0.1s;
            }
            .comic-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #111; }
            .comic-btn-skip { background: transparent; color: #aaa; border: 2px solid #555; box-shadow: none; }
            .comic-dots { display: flex; gap: 8px; }
            .comic-dot { width: 10px; height: 10px; border-radius: 50%; background: #555; }
            .comic-dot.active { background: #ffcc00; transform: scale(1.3); }
        `;
        document.head.appendChild(style);
    }

    start() {
        this.currentSlide = 0;
        this.overlay = document.createElement('div');
        this.overlay.id = 'prologue-overlay';

        const slidesHtml = this.slidesData.map((s, idx) => `
            <div class="comic-slide ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
                ${s.svg
                    ? `<div class="comic-art" role="img" aria-label="Слайд ${idx + 1}">${s.svg}</div>`
                    : `<img src="${s.img}" alt="Слайд ${idx + 1}" style="width:100%; height:100%; object-fit:cover;">`}
                <div class="comic-bubble">${s.text}</div>
            </div>
        `).join('');

        const dotsHtml = this.slidesData.map((_, idx) => `
            <div class="comic-dot ${idx === 0 ? 'active' : ''}"></div>
        `).join('');

        this.overlay.innerHTML = `
            <div class="comic-frame" id="comic-frame">${slidesHtml}</div>
            <div class="comic-controls">
                <button class="comic-btn comic-btn-skip" id="comic-skip">Пропустить</button>
                <div class="comic-dots">${dotsHtml}</div>
                <button class="comic-btn" id="comic-next">Далее ▸</button>
            </div>
        `;

        document.body.appendChild(this.overlay);

        this.overlay.querySelector('#comic-next').addEventListener('click', () => this._next());
        this.overlay.querySelector('#comic-skip').addEventListener('click', () => this._finish());
    }

    _next() {
        if (this.currentSlide < this.slidesData.length - 1) {
            this.currentSlide++;
            this._updateView();
        } else {
            this._finish();
        }
    }

    _updateView() {
        const slides = this.overlay.querySelectorAll('.comic-slide');
        const dots = this.overlay.querySelectorAll('.comic-dot');
        const frame = this.overlay.querySelector('#comic-frame');
        const btnNext = this.overlay.querySelector('#comic-next');

        slides.forEach((el, i) => el.classList.toggle('active', i === this.currentSlide));
        dots.forEach((el, i) => el.classList.toggle('active', i === this.currentSlide));

        frame.classList.remove('comic-shake');
        if (this.slidesData[this.currentSlide].shake) {
            void frame.offsetWidth;
            frame.classList.add('comic-shake');
        }

        btnNext.textContent = this.currentSlide === this.slidesData.length - 1 ? 'В бой! 🦆' : 'Далее ▸';
    }

    _finish() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (typeof this.onComplete === 'function') {
            this.onComplete();
        }
    }
}
