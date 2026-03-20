import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../store/gameStore';
import { BoardView } from '../components/BoardView';
import { PieceSelector } from '../components/PieceSelector';
import { ScoreBar } from '../components/ScoreBar';
import { ResultModal } from '../components/ResultModal';
import { AdManager } from '../ads/AdManager';
import { Analytics } from '../analytics';
import { Colors, Typography, Spacing, Radii } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

export function GameScreen({ navigation }: Props) {
  const {
    daily,
    currentGame,
    selectedPieceIndex,
    selectPiece,
    placePieceAt,
    useRevival,
    retryCurrentPuzzle,
    advanceToNextPuzzle,
    startCurrentPuzzle,
  } = useGameStore();

  const [showResultModal, setShowResultModal] = useState(false);
  const [adReady, setAdReady] = useState(false);

  useEffect(() => {
    Analytics.logScreen('GameScreen');
    if (!currentGame) {
      startCurrentPuzzle();
    }
  }, []);

  // Watch for game state changes to show modal
  useEffect(() => {
    if (currentGame?.isComplete || currentGame?.isFailed) {
      setShowResultModal(true);
    }
  }, [currentGame?.isComplete, currentGame?.isFailed]);

  // Poll ad readiness
  useEffect(() => {
    const interval = setInterval(() => {
      setAdReady(AdManager.isRewardedReady());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (selectedPieceIndex === null) return;
      placePieceAt(row, col);
    },
    [selectedPieceIndex, placePieceAt]
  );

  const handleRevive = useCallback(() => {
    setShowResultModal(false);
    AdManager.showRewarded((success) => {
      if (success) {
        useRevival();
      } else {
        // Ad failed, show modal again
        setShowResultModal(true);
        Alert.alert('広告を読み込めませんでした', 'しばらくしてから再試行してください');
      }
    });
  }, [useRevival]);

  const handleRetry = useCallback(() => {
    setShowResultModal(false);
    retryCurrentPuzzle();
  }, [retryCurrentPuzzle]);

  const handleNext = useCallback(() => {
    setShowResultModal(false);

    const isLast = daily
      ? daily.currentPuzzleIndex >= daily.puzzles.length - 1
      : true;

    if (isLast) {
      // Show interstitial before going to daily complete
      AdManager.showInterstitial(() => {
        advanceToNextPuzzle().then(() => {
          navigation.replace('DailyComplete');
        });
      });
    } else {
      // Show interstitial between puzzles
      AdManager.showInterstitial(() => {
        advanceToNextPuzzle().then(() => {
          startCurrentPuzzle();
        });
      });
    }
  }, [daily, advanceToNextPuzzle, navigation, startCurrentPuzzle]);

  if (!currentGame || !daily) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentPuzzle = daily.puzzles[daily.currentPuzzleIndex];
  const isLastPuzzle = daily.currentPuzzleIndex >= daily.puzzles.length - 1;
  const selectedPiece =
    selectedPieceIndex !== null ? currentGame.pieces[selectedPieceIndex] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Score Bar */}
      <ScoreBar
        score={currentGame.score}
        linesCleared={currentGame.linesCleared}
        puzzleOrder={daily.currentPuzzleIndex + 1}
        totalPuzzles={daily.puzzles.length}
      />

      {/* Board */}
      <View style={styles.boardContainer}>
        <BoardView
          board={currentGame.board}
          selectedPiece={selectedPiece}
          onCellPress={handleCellPress}
          disabled={currentGame.isComplete || currentGame.isFailed}
        />
      </View>

      {/* Piece Selector */}
      <PieceSelector
        pieces={currentGame.pieces}
        selectedIndex={selectedPieceIndex}
        onSelectPiece={selectPiece}
      />

      {/* Result Modal */}
      <ResultModal
        visible={showResultModal}
        type={currentGame.isComplete ? 'success' : 'fail'}
        score={currentGame.score}
        linesCleared={currentGame.linesCleared}
        canRevive={!currentGame.revivalUsed}
        onRevive={handleRevive}
        onNext={handleNext}
        onRetry={handleRetry}
        isLastPuzzle={isLastPuzzle}
        adReady={adReady}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
});
