import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from '../game/GameScene';

const Game = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return;
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: [GameScene],
      parent: 'phaser-container',
      backgroundColor: '#222',
    });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id="phaser-container" className="w-full h-full" />;
};

export default Game; 