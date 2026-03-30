import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { BoardView, CELL_SIZE } from '../components/BoardView';
import { OverlayModal } from '../components/OverlayModal';
import { PieceSelector } from '../components/PieceSelector';
import { AdManager } from '../ads/AdManager';
import { Analytics } from '../analytics';
import { Colors, Typography, Spacing, Radii } from '../theme';
import { SoundManager } from '../audio/SoundManager';
import { useGameplay } from '../hooks/useGameplay';
import { CelebrationOverlay } from '../components/CelebrationOverlay';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EndlessGame'>;
};

function getDifficultyForLevel(level: number): { name: string; label: string } {
  if (level <= 3) return { name: 'easy', label: '初級' };
  if (level <= 7) return { name: 'medium', label: '中級' };
  if (level <= 14) return { name: 'hard', label: '上級' };
  if (level <= 25) return { name: 'expert', label: '達人' };
  return { name: 'master', label: '極' };
}

function isDifficultyChange(currentLevel: number, nextLevel: number): boolean {
  return getDifficultyForLevel(currentLevel).name !== getDifficultyForLevel(nextLevel).name;
}

export function EndlessGameScreen({ navigation }: Props) {
  const endless = useGameStore(s => s.endless);
  const currentGame = useGameStore(s => s.currentGame);
  const selectedPieceIndex = useGameStore(s => s.selectedPieceIndex);
  const selectPiece = useGameStore(s => s.selectPiece);
  const startEndlessPuzzle = useGameStore(s => s.startEndlessPuzzle);
  const advanceEndless = useGameStore(s => s.advanceEndless);
  const endEndlessRun = useGameStore(s => s.endEndlessRun);
  const retryEndless = useGameStore(s => s.retryEndless);
  const pauseEndless = useGameStore(s => s.pauseEndless);
  const useRevival = useGameStore(s => s.useRevival);
  const getHint = useGameStore(s => s.getHint);
  const undoLastMove = useGameStore(s => s.undoLastMove);

  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverData, setGameOverData] = useState<{ totalScore: number; level: number; newHighScore: boolean } | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ nextLevel: number; label: string } | null>(null);
  const [showPauseModal, setShowPauseModal] = useState(false);

  const currentPuzzleId = endless?.currentPuzzle.id ?? null;

  const gameplay = useGameplay({ currentPuzzleId });

  // Init
  useEffect(() => {
    Analytics.logScreen('EndlessGameScreen');
    if (!currentGame) {
      startEndlessPuzzle();
    }
  }, []);

  // ─── Hint (rewarded ad) ───
  const handleHint = useCallback(() => {
    if (!currentGame || currentGame.hintsUsed >= 2) return;

    AdManager.showRewarded((success) => {
      if (success) {
        const hint = getHint();
        if (hint) {
          gameplay.showHint(hint.cells);
          selectPiece(hint.pieceIndex);
        }
      } else {
        Alert.alert('広告を読み込めませんでした', 'しばらくしてから再試行してください');
      }
    }, 'endless_hint');
  }, [currentGame, getHint, gameplay, selectPiece]);

  // ─── Undo (rewarded ad) ───
  const handleUndo = useCallback(() => {
    if (!currentGame || currentGame.undoUsed || currentGame.moveHistory.length === 0) return;

    AdManager.showRewarded((success) => {
      if (success) {
        gameplay.setShowResultModal(false);
        gameplay.resetAnimState();
        undoLastMove();
      } else {
        Alert.alert('広告を読み込めませんでした', 'しばらくしてから再試行してください');
      }
    }, 'endless_undo');
  }, [currentGame, undoLastMove, gameplay]);

  // Restart entire run
  const handleRestart = useCallback(async () => {
    gameplay.setShowResultModal(false);
    setShowGameOverModal(false);
    await retryEndless();
    startEndlessPuzzle();
  }, [retryEndless, startEndlessPuzzle, gameplay]);

  // Advance to next level
  const handleNext = useCallback(() => {
    gameplay.setShowResultModal(false);
    const currentLevel = endless?.currentLevel ?? 1;
    const nextLevel = currentLevel + 1;
    const diffChange = isDifficultyChange(currentLevel, nextLevel);

    if (diffChange) {
      const { label } = getDifficultyForLevel(nextLevel);
      setLevelUpInfo({ nextLevel, label });
      SoundManager.playLevelUp();
      setTimeout(() => {
        advanceEndless().then(() => {
          setLevelUpInfo(null);
          startEndlessPuzzle();
        });
      }, 2000);
    } else {
      advanceEndless().then(() => {
        startEndlessPuzzle();
      });
    }
  }, [endless?.currentLevel, advanceEndless, startEndlessPuzzle, gameplay]);

  // End run from success modal
  const handleEndRunFromSuccess = useCallback(async () => {
    gameplay.setShowResultModal(false);
    const result = await endEndlessRun();
    setGameOverData(result);
    setShowGameOverModal(true);
  }, [endEndlessRun, gameplay]);

  // Game over from fail
  const handleGameOver = useCallback(async () => {
    gameplay.setShowResultModal(false);
    const result = await endEndlessRun();
    setGameOverData(result);
    setShowGameOverModal(true);
  }, [endEndlessRun, gameplay]);

  // Pause
  const handlePause = useCallback(async () => {
    setShowPauseModal(false);
    await pauseEndless();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [pauseEndless, navigation]);

  // Quit mid-game
  const handleQuitMidGame = useCallback(async () => {
    setShowPauseModal(false);
    const result = await endEndlessRun();
    setGameOverData(result);
    setShowGameOverModal(true);
  }, [endEndlessRun]);

  // Retry single puzzle
  const handleRetryPuzzle = useCallback(() => {
    gameplay.setShowResultModal(false);
    gameplay.resetAnimState();
    startEndlessPuzzle();
  }, [startEndlessPuzzle, gameplay]);

  // Revival (rewarded ad)
  const handleRevive = useCallback(() => {
    gameplay.setShowResultModal(false);
    AdManager.showRewarded((success) => {
      if (success) {
        gameplay.resetAnimState();
        useRevival();
      } else {
        gameplay.setShowResultModal(true);
      }
    }, 'endless_revival');
  }, [useRevival, gameplay]);

  // ─── Floating piece ───
  const renderFloatingPiece = () => {
    const data = gameplay.getFloatingPieceData();
    if (!data) return null;

    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.floatingPiece, {
          transform: [{ translateX: gameplay.dragX }, { translateY: gameplay.dragY }, { scale: gameplay.dragScale }],
          opacity: gameplay.dragOpacity,
        }]}
      >
        {data.grid.map((row, r) => (
          <View key={r} style={styles.floatingRow}>
            {row.map((filled, c) => (
              <View
                key={c}
                style={[
                  styles.floatingCell,
                  filled ? { backgroundColor: data.pieceColor, ...styles.floatingFilledCell } : { backgroundColor: 'transparent' },
                ]}
              />
            ))}
          </View>
        ))}
      </Animated.View>
    );
  };

  if (!endless) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentGame && !endless.isGenerating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedPiece = selectedPieceIndex !== null && currentGame ? currentGame.pieces[selectedPieceIndex] : null;
  const draggingPiece = gameplay.draggingPieceIndex !== null && currentGame ? currentGame.pieces[gameplay.draggingPieceIndex] ?? null : null;
  const canHint = currentGame && !currentGame.isComplete && !currentGame.isFailed && currentGame.hintsUsed < 2 && gameplay.adReady;
  const canUndo = currentGame && !currentGame.isComplete && !currentGame.isFailed && !currentGame.undoUsed && currentGame.moveHistory.length > 0 && gameplay.adReady;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowPauseModal(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.headerButtonText}>||</Text>
          </TouchableOpacity>
          <View style={styles.endlessInfo}>
            <View style={styles.endlessStat}>
              <Text style={styles.endlessStatValue}>{endless.currentLevel}</Text>
              <Text style={styles.endlessStatLabel}>レベル</Text>
            </View>
            <View style={styles.endlessDivider} />
            <View style={styles.endlessStat}>
              <Animated.Text style={[styles.endlessStatValue, { transform: [{ scale: gameplay.scoreScale }] }]}>
                {(endless.totalScore + (currentGame?.score ?? 0)).toLocaleString()}
              </Animated.Text>
              <Text style={styles.endlessStatLabel}>合計スコア</Text>
            </View>
            <View style={styles.endlessDivider} />
            <View style={styles.endlessStat}>
              <Text style={styles.endlessStatValue}>{currentGame?.linesCleared ?? 0}</Text>
              <Text style={styles.endlessStatLabel}>消去</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {canHint && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleHint}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.actionButtonText}>💡</Text>
              </TouchableOpacity>
            )}
            {canUndo && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleUndo}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.actionButtonText}>↩</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRetryPuzzle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.actionButtonText, { fontSize: Typography.xl }]}>↺</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Board */}
        {currentGame && (
          <View style={styles.boardContainer}>
            <View ref={gameplay.boardRef} onLayout={gameplay.measureBoard} collapsable={false}>
              <BoardView
                board={currentGame.board}
                selectedPiece={selectedPiece}
                onCellPress={gameplay.handleCellPress}
                disabled={currentGame.isComplete || currentGame.isFailed}
                ghostPiece={draggingPiece}
                ghostRow={gameplay.ghostCell?.row ?? null}
                ghostCol={gameplay.ghostCell?.col ?? null}
                isGhostValid={gameplay.isGhostValid}
                placedCells={gameplay.placedCells}
                placementScale={gameplay.placementScale}
                clearedLines={gameplay.clearedLines}
                clearFlash={gameplay.clearFlash}
                clearCellScales={gameplay.clearCellScales}
                hintCells={gameplay.hintCells}
                hintPulse={gameplay.hintPulse}
              />
            </View>

            {/* Score popup */}
            {gameplay.scorePopup && (
              <Animated.View
                pointerEvents="none"
                style={[styles.scorePopup, {
                  opacity: gameplay.scorePopupOpacity,
                  transform: [{ translateY: gameplay.scorePopupY }, { scale: gameplay.scorePopupScale }],
                }]}
              >
                <Text style={styles.scorePopupText}>+{gameplay.scorePopup.value}</Text>
              </Animated.View>
            )}

            {/* Combo text */}
            {gameplay.comboText && (
              <Animated.View
                pointerEvents="none"
                style={[styles.comboContainer, {
                  opacity: gameplay.comboOpacity,
                  transform: [{ scale: gameplay.comboScale }],
                }]}
              >
                <Text style={styles.comboText}>{gameplay.comboText}</Text>
              </Animated.View>
            )}
          </View>
        )}

        {/* Pieces */}
        {currentGame && (
          <PieceSelector
            pieces={currentGame.pieces}
            selectedIndex={selectedPieceIndex}
            onSelectPiece={selectPiece}
            draggingIndex={gameplay.draggingPieceIndex}
            onDragStart={gameplay.handleDragStart}
            onDragMove={gameplay.handleDragMove}
            onDragEnd={gameplay.handleDragEnd}
          />
        )}

        {/* Success modal */}
        <OverlayModal visible={gameplay.showResultModal && !!currentGame?.isComplete}>
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalHeader, { backgroundColor: Colors.success }]}>
                <Text style={styles.modalEmoji}>✓</Text>
                <Text style={styles.modalTitle}>レベル{endless.currentLevel} クリア！</Text>
              </View>
              <View style={styles.modalStats}>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>スコア</Text>
                  <Text style={styles.modalStatValue}>{currentGame?.score.toLocaleString()}</Text>
                </View>
                {(currentGame?.linesCleared ?? 0) > 0 && (
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>ライン消去</Text>
                    <Text style={[styles.modalStatValue, { color: Colors.success }]}>+{currentGame?.linesCleared}</Text>
                  </View>
                )}
                {(currentGame?.consecutiveClearCount ?? 0) >= 2 && (
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>最大コンボ</Text>
                    <Text style={[styles.modalStatValue, { color: Colors.warning }]}>x{currentGame?.consecutiveClearCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.accent }]} onPress={handleNext}>
                  <Text style={styles.modalButtonTextPrimary}>次のレベルへ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.secondaryButton]} onPress={handleEndRunFromSuccess}>
                  <Text style={styles.modalButtonTextSecondary}>ここで終了する</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </OverlayModal>

        {/* Fail modal */}
        <OverlayModal visible={gameplay.showResultModal && !!currentGame?.isFailed}>
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalHeader, { backgroundColor: Colors.surfaceAlt }]}>
                <Text style={styles.modalEmoji}>×</Text>
                <Text style={styles.modalTitle}>配置できません</Text>
              </View>
              <Text style={styles.failMessage}>残りのピースを置く場所がありません。</Text>
              <View style={styles.modalActions}>
                {!currentGame?.revivalUsed && gameplay.adReady ? (
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.warning }]} onPress={handleRevive}>
                    <Text style={styles.modalButtonTextPrimary}>広告を見てやり直す</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.accent }]} onPress={handleRetryPuzzle}>
                    <Text style={styles.modalButtonTextPrimary}>やり直す</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.modalButton, styles.secondaryButton]} onPress={handleGameOver}>
                  <Text style={styles.modalButtonTextSecondary}>ゲーム終了</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </OverlayModal>

        {/* Pause modal */}
        <OverlayModal visible={showPauseModal} onRequestClose={() => setShowPauseModal(false)}>
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalHeader, { backgroundColor: Colors.accent }]}>
                <Text style={styles.modalEmoji}>||</Text>
                <Text style={styles.modalTitle}>一時停止</Text>
              </View>
              <View style={styles.modalStats}>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>レベル</Text>
                  <Text style={styles.modalStatValue}>{endless.currentLevel}</Text>
                </View>
                <View style={styles.modalStatRow}>
                  <Text style={styles.modalStatLabel}>合計スコア</Text>
                  <Text style={styles.modalStatValue}>
                    {(endless.totalScore + (currentGame?.score ?? 0)).toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: Colors.accent }]}
                  onPress={() => setShowPauseModal(false)}
                >
                  <Text style={styles.modalButtonTextPrimary}>再開する</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.secondaryButton]} onPress={handlePause}>
                  <Text style={styles.modalButtonTextSecondary}>中断して戻る</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.error }]} onPress={handleQuitMidGame}>
                  <Text style={styles.modalButtonTextPrimary}>ゲーム終了</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </OverlayModal>

        {/* Game Over modal */}
        <OverlayModal visible={showGameOverModal}>
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalHeader, { backgroundColor: Colors.accent }]}>
                <Text style={styles.modalEmoji}>◈</Text>
                <Text style={styles.modalTitle}>ゲーム終了</Text>
              </View>
              {gameOverData && (
                <View style={styles.modalStats}>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>到達レベル</Text>
                    <Text style={styles.modalStatValue}>{gameOverData.level}</Text>
                  </View>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>合計スコア</Text>
                    <Text style={styles.modalStatValue}>{gameOverData.totalScore.toLocaleString()}</Text>
                  </View>
                  {gameOverData.newHighScore && (
                    <View style={styles.newRecordBadge}>
                      <Text style={styles.newRecordText}>ハイスコア更新！</Text>
                    </View>
                  )}
                  {endless.highScore > 0 && !gameOverData.newHighScore && (
                    <View style={styles.modalStatRow}>
                      <Text style={styles.modalStatLabel}>ハイスコア</Text>
                      <Text style={[styles.modalStatValue, { color: Colors.accent }]}>{endless.highScore.toLocaleString()}</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.accent }]} onPress={handleRestart}>
                  <Text style={styles.modalButtonTextPrimary}>もう一度挑戦</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.secondaryButton]} onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                  }
                }}>
                  <Text style={styles.modalButtonTextSecondary}>ホームに戻る</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </OverlayModal>
      </SafeAreaView>

      <View style={styles.floatingOverlay} pointerEvents="none">
        {renderFloatingPiece()}
      </View>

      {/* Celebration particles */}
      <CelebrationOverlay visible={gameplay.showCelebration} />

      {/* Level-up announcement overlay */}
      {levelUpInfo && (
        <View style={styles.generatingOverlay}>
          <View style={styles.levelUpCard}>
            <Text style={styles.levelUpBadge}>{levelUpInfo.label}</Text>
            <Text style={styles.levelUpTitle}>難易度が上がります</Text>
            <Text style={styles.levelUpLevel}>レベル {levelUpInfo.nextLevel}</Text>
            <View style={styles.levelUpLoader}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={styles.levelUpLoaderText}>次のパズルを生成中...</Text>
            </View>
          </View>
        </View>
      )}

      {/* Loading overlay */}
      {!levelUpInfo && endless?.isGenerating && (
        <View style={styles.generatingOverlay}>
          <View style={styles.generatingCard}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.generatingTitle}>レベル {endless.currentLevel}</Text>
            <Text style={styles.generatingText}>パズルを準備中...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.xs,
  },
  actionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
  },
  endlessInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  endlessStat: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  endlessStatValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  endlessStatLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  endlessDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: Typography.base, color: Colors.textSecondary },
  floatingOverlay: { ...StyleSheet.absoluteFillObject },
  floatingPiece: {
    position: 'absolute', left: 0, top: 0, flexDirection: 'column',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  floatingRow: { flexDirection: 'row' },
  floatingCell: { width: CELL_SIZE - 2, height: CELL_SIZE - 2, margin: 1, borderRadius: 4 },
  floatingFilledCell: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  scorePopup: { position: 'absolute', top: '40%', alignSelf: 'center' },
  scorePopupText: {
    fontSize: 28, fontWeight: '800' as const, color: Colors.accent,
    textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  comboContainer: { position: 'absolute', top: '18%', alignSelf: 'center' },
  comboText: {
    fontSize: 22, fontWeight: '900' as const, color: Colors.warning,
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4, letterSpacing: 2,
  },
  overlay: {
    flex: 1, backgroundColor: 'rgba(44, 42, 38, 0.55)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxl,
  },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radii.xl, overflow: 'hidden', width: '100%', maxWidth: 340 },
  modalHeader: { paddingVertical: Spacing.xl, alignItems: 'center' },
  modalEmoji: { fontSize: 36, color: Colors.surface, fontWeight: Typography.bold, marginBottom: Spacing.xs },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.surface },
  modalStats: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  modalStatRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalStatLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  modalStatValue: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  modalActions: { padding: Spacing.base, gap: Spacing.sm },
  modalButton: { borderRadius: Radii.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  modalButtonTextPrimary: { color: Colors.surface, fontSize: Typography.md, fontWeight: Typography.semibold },
  secondaryButton: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  modalButtonTextSecondary: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.medium },
  failMessage: {
    fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, lineHeight: 22,
  },
  newRecordBadge: { alignItems: 'center', paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  newRecordText: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.warning },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245, 240, 232, 0.92)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  generatingCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.xl, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xl,
    alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
  },
  generatingTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: Spacing.lg },
  generatingText: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: Spacing.xs },
  levelUpCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.xl, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xxl,
    alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10, minWidth: 260,
  },
  levelUpBadge: { fontSize: Typography.xxxl, fontWeight: Typography.bold, color: Colors.accent, letterSpacing: 4 },
  levelUpTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary, marginTop: Spacing.base },
  levelUpLevel: { fontSize: Typography.md, fontWeight: Typography.medium, color: Colors.textSecondary, marginTop: Spacing.xs },
  levelUpLoader: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl, gap: Spacing.sm },
  levelUpLoaderText: { fontSize: Typography.sm, color: Colors.textMuted },
});
