import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { BoardView, CELL_SIZE } from '../components/BoardView';
import { PieceSelector } from '../components/PieceSelector';
import { ScoreBar } from '../components/ScoreBar';
import { ResultModal } from '../components/ResultModal';
import { AdManager } from '../ads/AdManager';
import { shouldShowDailyCompleteInterstitial, shouldShowInterPuzzleInterstitial } from '../ads/adPolicy';
import { Analytics } from '../analytics';
import { Colors, Typography, Spacing } from '../theme';
import { useGameplay } from '../hooks/useGameplay';
import { calculateStarRating } from '../game/starRating';
import { CelebrationOverlay } from '../components/CelebrationOverlay';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

export function GameScreen({ navigation, route }: Props) {
  const targetDate = route.params?.date;
  const daily = useGameStore(s => s.daily);
  const currentGame = useGameStore(s => s.currentGame);
  const selectedPieceIndex = useGameStore(s => s.selectedPieceIndex);
  const selectPiece = useGameStore(s => s.selectPiece);
  const retryCurrentPuzzle = useGameStore(s => s.retryCurrentPuzzle);
  const advanceToNextPuzzle = useGameStore(s => s.advanceToNextPuzzle);
  const startCurrentPuzzle = useGameStore(s => s.startCurrentPuzzle);
  const useRevival = useGameStore(s => s.useRevival);
  const getHint = useGameStore(s => s.getHint);
  const undoLastMove = useGameStore(s => s.undoLastMove);

  const currentPuzzleId = daily?.puzzles[daily?.currentPuzzleIndex ?? 0]?.id ?? null;

  const gameplay = useGameplay({ currentPuzzleId });

  // ─── Init ───
  useEffect(() => {
    Analytics.logScreen('GameScreen');
    if (!currentGame) {
      startCurrentPuzzle();
    }
  }, []);

  // ─── Close game ───
  const handleClose = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [navigation]);

  // ─── Restart ───
  const handleRestart = useCallback(() => {
    gameplay.setShowResultModal(false);
    gameplay.resetAnimState();
    retryCurrentPuzzle();
  }, [retryCurrentPuzzle, gameplay]);

  // ─── Hint (rewarded ad) ───
  const handleHint = useCallback(() => {
    if (!currentGame || currentGame.hintsUsed >= 2) return;

    AdManager.showRewarded((success) => {
      if (success) {
        const hint = getHint();
        if (hint) {
          gameplay.showHint(hint.cells);
          // Auto-select the hinted piece
          selectPiece(hint.pieceIndex);
        }
      } else {
        Alert.alert('広告を読み込めませんでした', 'しばらくしてから再試行してください');
      }
    }, 'daily_hint');
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
    }, 'daily_undo');
  }, [currentGame, undoLastMove, gameplay]);

  // ─── Revival ───
  const handleRevive = useCallback(() => {
    gameplay.setShowResultModal(false);
    AdManager.showRewarded((success) => {
      if (success) {
        gameplay.resetAnimState();
        useRevival();
      } else {
        gameplay.setShowResultModal(true);
        Alert.alert('広告を読み込めませんでした', 'しばらくしてから再試行してください');
      }
    }, 'daily_revival');
  }, [useRevival, gameplay]);

  const handleRetry = useCallback(() => {
    handleRestart();
  }, [handleRestart]);

  // ─── Next puzzle (with inter-puzzle interstitial) ───
  const handleNext = useCallback(() => {
    gameplay.setShowResultModal(false);
    const isLast = daily
      ? daily.currentPuzzleIndex >= daily.puzzles.length - 1
      : true;

    if (isLast) {
      const goToComplete = () => {
        advanceToNextPuzzle().then(() => {
          navigation.replace('DailyComplete');
        });
      };

      const shouldShowAd = daily
        ? shouldShowDailyCompleteInterstitial(daily.puzzles.length)
        : false;

      if (shouldShowAd) {
        AdManager.showInterstitial(goToComplete, 'daily_complete');
      } else {
        goToComplete();
      }
      return;
    }

    // Inter-puzzle interstitial
    const goToNext = () => {
      advanceToNextPuzzle().then(() => {
        startCurrentPuzzle();
      });
    };

    const shouldShowInterPuzzle = daily
      ? shouldShowInterPuzzleInterstitial(daily.currentPuzzleIndex, daily.puzzles.length)
      : false;

    if (shouldShowInterPuzzle) {
      AdManager.showInterstitial(goToNext, 'inter_puzzle');
    } else {
      goToNext();
    }
  }, [daily, advanceToNextPuzzle, navigation, startCurrentPuzzle, gameplay]);

  // ─── Floating piece rendering ───
  const renderFloatingPiece = () => {
    const data = gameplay.getFloatingPieceData();
    if (!data) return null;

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingPiece,
          {
            transform: [
              { translateX: gameplay.dragX },
              { translateY: gameplay.dragY },
              { scale: gameplay.dragScale },
            ],
            opacity: gameplay.dragOpacity,
          },
        ]}
      >
        {data.grid.map((row, r) => (
          <View key={r} style={styles.floatingRow}>
            {row.map((filled, c) => (
              <View
                key={c}
                style={[
                  styles.floatingCell,
                  filled
                    ? { backgroundColor: data.pieceColor, ...styles.floatingFilledCell }
                    : { backgroundColor: 'transparent' },
                ]}
              />
            ))}
          </View>
        ))}
      </Animated.View>
    );
  };

  // ─── Loading ───
  if (!currentGame || !daily) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedPiece =
    selectedPieceIndex !== null ? currentGame.pieces[selectedPieceIndex] : null;
  const draggingPiece =
    gameplay.draggingPieceIndex !== null ? currentGame.pieces[gameplay.draggingPieceIndex] ?? null : null;
  const isLastPuzzle = daily.currentPuzzleIndex >= daily.puzzles.length - 1;
  const currentPuzzle = daily.puzzles[daily.currentPuzzleIndex];
  const puzzleStars = currentGame.isComplete && currentPuzzle
    ? calculateStarRating(currentGame.score, currentPuzzle)
    : undefined;
  const canHint = !currentGame.isComplete && !currentGame.isFailed && currentGame.hintsUsed < 2 && gameplay.adReady;
  const canUndo = !currentGame.isComplete && !currentGame.isFailed && !currentGame.undoUsed && currentGame.moveHistory.length > 0 && gameplay.adReady;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.headerButtonText}>✕</Text>
          </TouchableOpacity>
          <ScoreBar
            score={currentGame.score}
            linesCleared={currentGame.linesCleared}
            puzzleOrder={daily.currentPuzzleIndex + 1}
            totalPuzzles={daily.puzzles.length}
            scoreScale={gameplay.scoreScale}
            comboCount={currentGame.consecutiveClearCount}
          />
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
              onPress={handleRestart}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.actionButtonText, { fontSize: Typography.xl }]}>↺</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Board */}
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
              style={[
                styles.scorePopup,
                {
                  opacity: gameplay.scorePopupOpacity,
                  transform: [
                    { translateY: gameplay.scorePopupY },
                    { scale: gameplay.scorePopupScale },
                  ],
                },
              ]}
            >
              <Text style={styles.scorePopupText}>+{gameplay.scorePopup.value}</Text>
            </Animated.View>
          )}

          {/* Combo text */}
          {gameplay.comboText && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.comboContainer,
                {
                  opacity: gameplay.comboOpacity,
                  transform: [{ scale: gameplay.comboScale }],
                },
              ]}
            >
              <Text style={styles.comboText}>{gameplay.comboText}</Text>
            </Animated.View>
          )}
        </View>

        {/* Piece Selector */}
        <PieceSelector
          pieces={currentGame.pieces}
          selectedIndex={selectedPieceIndex}
          onSelectPiece={selectPiece}
          draggingIndex={gameplay.draggingPieceIndex}
          onDragStart={gameplay.handleDragStart}
          onDragMove={gameplay.handleDragMove}
          onDragEnd={gameplay.handleDragEnd}
        />

        {/* Result Modal */}
        <ResultModal
          visible={gameplay.showResultModal}
          type={currentGame.isComplete ? 'success' : 'fail'}
          score={currentGame.score}
          linesCleared={currentGame.linesCleared}
          canRevive={!currentGame.revivalUsed}
          piecesRemaining={currentGame.pieces.length}
          onRevive={handleRevive}
          onNext={handleNext}
          onRetry={handleRetry}
          isLastPuzzle={isLastPuzzle}
          adReady={gameplay.adReady}
          comboCount={currentGame.consecutiveClearCount}
          stars={puzzleStars}
        />
      </SafeAreaView>

      {/* Floating piece overlay */}
      <View style={styles.floatingOverlay} pointerEvents="none">
        {renderFloatingPiece()}
      </View>

      {/* Celebration particles */}
      <CelebrationOverlay visible={gameplay.showCelebration} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  floatingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingPiece: {
    position: 'absolute',
    left: 0,
    top: 0,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingRow: {
    flexDirection: 'row',
  },
  floatingCell: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    margin: 1,
    borderRadius: 4,
  },
  floatingFilledCell: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  scorePopup: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
  },
  scorePopupText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.accent,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  comboContainer: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
  },
  comboText: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.warning,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
});
