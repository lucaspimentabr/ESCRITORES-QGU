import React from 'react';

interface LogoQGUProps {
  className?: string;
}

export const LogoQGU: React.FC<LogoQGUProps> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0 select-none`}
      aria-label="Logo QGU"
    >
      <defs>
        {/* Clip for the upper white portion */}
        <clipPath id="qgu-comp-top-clip">
          <path d="M 0 0 L 500 0 L 500 248 C 420 232 320 228 220 238 C 140 248 80 278 50 310 L 0 310 Z" />
        </clipPath>

        {/* Clip for the lower gold portion */}
        <clipPath id="qgu-comp-bottom-clip">
          <path d="M 0 324 C 75 292 140 256 220 246 C 320 236 420 240 500 256 L 500 500 L 0 500 Z" />
        </clipPath>
      </defs>

      {/* Umadespa Green Background */}
      <rect width="500" height="500" rx="44" fill="#3c612c" />

      {/* Top White Letters */}
      <g clipPath="url(#qgu-comp-top-clip)">
        {/* Outer Q */}
        <path
          d="M 112 155 C 80 155 58 178 58 212 L 58 274 C 58 308 80 331 112 331 C 124 331 135 327 144 320 L 157 338 C 160 342 165 344 170 344 C 178 344 183 338 181 330 L 171 306 C 178 296 182 284 182 270 L 182 212 C 182 178 160 155 128 155 Z"
          fill="#ffffff"
        />
        {/* Inner Q Counter (Cutout) */}
        <path
          d="M 116 186 C 104 186 92 196 92 212 L 92 272 C 92 288 104 298 116 298 C 128 298 140 288 140 272 L 140 212 C 140 196 128 186 116 186 Z"
          fill="#3c612c"
        />

        {/* Outer G */}
        <path
          d="M 238 155 C 205 155 185 178 185 212 L 185 274 C 185 308 205 331 238 331 C 265 331 285 315 292 288 C 293 284 290 280 285 280 L 252 280 C 248 280 245 283 245 287 C 242 295 234 300 226 300 C 214 300 205 290 205 274 L 205 212 C 205 196 214 186 226 186 C 238 186 247 196 247 212 L 247 220 C 247 224 250 228 255 228 L 292 228 C 297 228 300 224 300 220 L 300 212 C 300 178 278 155 245 155 Z"
          fill="#ffffff"
        />

        {/* Outer U */}
        <path
          d="M 310 155 L 344 155 L 344 268 C 344 284 354 296 368 296 C 382 296 392 284 392 268 L 392 155 L 426 155 L 426 270 C 426 306 402 331 368 331 C 334 331 310 306 310 270 Z"
          fill="#ffffff"
        />
      </g>

      {/* Bottom Gold/Tan Letters */}
      <g clipPath="url(#qgu-comp-bottom-clip)">
        {/* Outer Q */}
        <path
          d="M 112 155 C 80 155 58 178 58 212 L 58 274 C 58 308 80 331 112 331 C 124 331 135 327 144 320 L 157 338 C 160 342 165 344 170 344 C 178 344 183 338 181 330 L 171 306 C 178 296 182 284 182 270 L 182 212 C 182 178 160 155 128 155 Z"
          fill="#b4a96e"
        />
        {/* Inner Q Counter (Cutout) */}
        <path
          d="M 116 186 C 104 186 92 196 92 212 L 92 272 C 92 288 104 298 116 298 C 128 298 140 288 140 272 L 140 212 C 140 196 128 186 116 186 Z"
          fill="#3c612c"
        />

        {/* Outer G */}
        <path
          d="M 238 155 C 205 155 185 178 185 212 L 185 274 C 185 308 205 331 238 331 C 265 331 285 315 292 288 C 293 284 290 280 285 280 L 252 280 C 248 280 245 283 245 287 C 242 295 234 300 226 300 C 214 300 205 290 205 274 L 205 212 C 205 196 214 186 226 186 C 238 186 247 196 247 212 L 247 220 C 247 224 250 228 255 228 L 292 228 C 297 228 300 224 300 220 L 300 212 C 300 178 278 155 245 155 Z"
          fill="#b4a96e"
        />

        {/* Outer U */}
        <path
          d="M 310 155 L 344 155 L 344 268 C 344 284 354 296 368 296 C 382 296 392 284 392 268 L 392 155 L 426 155 L 426 270 C 426 306 402 331 368 331 C 334 331 310 306 310 270 Z"
          fill="#b4a96e"
        />
      </g>

      {/* Arced White Swoosh Ribbon sweeping across and extending past the U */}
      <path
        d="M 58 308 C 65 292 110 256 195 240 C 275 226 365 228 440 245 C 400 238 318 232 245 238 C 165 245 105 274 58 308 Z"
        fill="#ffffff"
      />
    </svg>
  );
};
