"use client"
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { User, X, ChevronLeft, ChevronRight, BarChart2, MessageCircle, Shield } from 'lucide-react';
import { PlayerStats, RecentGame, VisualEffect, SoundEffect, Effect, ActiveTab } from './types';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import PushNotification from './ui/push_notification';
import ChatContainer from './ui/chat_container';
import axios from 'axios';
import { createCommand, executeCommand, Command } from '../utils/chatCommands';
import AdminContainer from './ui/admin_container';

type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
};

const API_URL = 'http://localhost:3001';

const CPSGame: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [showUsernameSelection, setShowUsernameSelection] = useState<boolean>(true);
  const [cooldownActive, setCooldownActive] = useState<boolean>(false);
  const [cooldownTime, setCooldownTime] = useState<number>(2);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [clicks, setClicks] = useState<number>(0);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    level: 1,
    xp: 0,
    bestCPS: 0,
    totalGames: 0,
    totalClicks: 0,
  });
  const [isProfileFocused, setIsProfileFocused] = useState<boolean>(false);
  const [isChatFocused, setIsChatFocused] = useState<boolean>(false);
  const [gameDuration, setGameDuration] = useState<number>(10);
  const [selectedVisualEffect, setSelectedVisualEffect] = useState<VisualEffect>('None');
  const [selectedSoundEffect, setSelectedSoundEffect] = useState<SoundEffect>('None');
  const [selectedCountry, setSelectedCountry] = useState<string>('TR');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string, message: string, username: string, profilePicture: string, level: number }[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ username: string; bestCPS: number }[]>([]);
  const [password, setPassword] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [justEnteredUsername, setJustEnteredUsername] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoginInitialized, setIsLoginInitialized] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'cps' | 'level' | 'averageCps'>('cps');
  const [leaderboardPage, setLeaderboardPage] = useState<number>(1);
  const [chatCommands, setChatCommands] = useState<Command[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [isDisguised, setIsDisguised] = useState<boolean>(false);
  const [disguisedUsername, setDisguisedUsername] = useState<string>('');
  const ITEMS_PER_PAGE = 10;

  const XP_PER_CLICK = 1;
  const XP_PER_LEVEL = 100;

  const createDefaultPlayerStats = (): PlayerStats => ({
    level: 1,
    xp: 0,
    bestCPS: 0,
    totalGames: 0,
    totalClicks: 0,
  });

  const toggleAdminPanel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowAdminPanel(!showAdminPanel);
  };

  const fetchUserData = useCallback(async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data;
      setUsername(userData.username);
      setPlayerStats(userData.playerStats);
      setRecentGames(userData.recentGames || []);
      setSelectedCountry(userData.selectedCountry || 'TR');
      setProfilePicture(userData.profilePicture || '');
      setIsAdmin(userData.isAdmin || false);
      console.log('user data fetched:', userData);
    } catch (error) {
      console.error('error fetching user data:', error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        localStorage.removeItem('token');
        setToken(null);
        setShowUsernameSelection(true);
        addNotification('Session expired. Please log in again.', 'error');
      }
      setPlayerStats(createDefaultPlayerStats());
      setRecentGames([]);
    }
  }, []);

  useEffect(() => {
    if (!showUsernameSelection) {
      const interval = setInterval(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          fetchUserData(storedToken);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [fetchUserData, showUsernameSelection]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('err loading leaderboard:', error);
    }
  }, []);

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    if (isLoginInitialized) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        message,
        type,
        timestamp: new Date().toISOString(),
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const getXPRequiredForLevel = (level: number) => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };

  const calculateNewLevelAndXP = (currentLevel: number, currentXP: number, xpGained: number) => {
    let newLevel = currentLevel;
    let totalXP = currentXP + xpGained;
    let xpForNextLevel = getXPRequiredForLevel(newLevel + 1);

    while (totalXP >= xpForNextLevel) {
      newLevel++;
      totalXP -= xpForNextLevel;
      xpForNextLevel = getXPRequiredForLevel(newLevel + 1);
    }

    return { newLevel, newXP: totalXP };
  };

  const sendErrorNotification = (message: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      type: 'error',
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !showUsernameSelection) {
      setToken(storedToken);
      fetchUserData(storedToken);
    } else if (!storedToken) {
      setPlayerStats(createDefaultPlayerStats());
    }
    
    if (!showUsernameSelection) {
      loadLeaderboard();
    }
  }, [fetchUserData, loadLeaderboard, showUsernameSelection]);

  useEffect(() => {
    setChatCommands([
      createCommand('help', 'Show available commands', false, (args) => {
        return chatCommands
          .filter(cmd => !cmd.adminOnly || isAdmin)
          .map(cmd => `/${cmd.name} - ${cmd.description}`)
          .join('\n');
      }),
      createCommand('clear', 'Clear chat messages', true, () => {
        setChatMessages([]);
        addNotification('Chat cleared.', 'info');
        return '';
      })
    ]);
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      console.log('login resp:', response.data);
      const { accessToken } = response.data;
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      setIsLoginInitialized(true);
      setNotifications([]); // im dumb
      await fetchUserData(accessToken);
      setShowUsernameSelection(false);
      addNotification(`Welcome back, ${username}!`, 'success');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.log(error.response.data.message)
        console.error('error logging in:', error);
        console.error('err resp:', error.response.data);
        const errorMessage = error.response.data.message?.trim();
        sendErrorNotification(errorMessage);
      } else {
        console.error('Unexpected error:', error);
        sendErrorNotification('An unexpected error occurred. Please try again later.');
      }
    }
  };


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/register`, { username, password });
      if (response.data.message) {
        sendErrorNotification(`Registration successful. Please log in.`);
        setUsername(username);
        setPassword(password);
        setIsRegistering(false);
      }
    } catch (error) {
      console.error('reg failed:', error);
      sendErrorNotification('Registration failed. Please try again.');
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  const startGame = () => {
    if (!isProfileFocused && !isChatFocused && !cooldownActive) {
      setGameActive(true);
      setGameOver(false);
      setTimeLeft(gameDuration);
      setClicks(0);
      setShowProfile(false);
      setGameStartTime(Date.now());  
      setLastUpdateTime(Date.now()); // have to update that
      addNotification('Game started!', 'info');
    }
  };

const endGame = async () => {
  setGameActive(false);
  setGameOver(true);
  if (gameStartTime) {
    const elapsedTime = (Date.now() - gameStartTime) / 1000;
    const cps = clicks / elapsedTime;
    const xpGained = clicks * XP_PER_CLICK;
    const { newLevel, newXP } = calculateNewLevelAndXP(playerStats.level, playerStats.xp, xpGained);

    try {
      const response = await axios.post(`${API_URL}/game`, {
        cps,
        clicks,
        duration: elapsedTime,
        xpGained,
        newLevel,
        newXP
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('game end response:', response.data);
      
      if (response.data.playerStats) {
        setPlayerStats(response.data.playerStats);
      } else {
        setPlayerStats(prevStats => ({
          ...prevStats,
          bestCPS: Math.max(prevStats.bestCPS, cps),
          totalGames: prevStats.totalGames + 1,
          totalClicks: prevStats.totalClicks + clicks,
          xp: newXP,
          level: newLevel,
        }));
      }
      
      // DON'T REMOVE
      const newGame = { cps, date: new Date().toISOString() };
      setRecentGames(prevGames => [{ ...newGame, date: new Date(newGame.date) }, ...prevGames].slice(0, 10));
      
      addNotification(`Game over! Your CPS: ${cps.toFixed(2)}`, 'info');
      if (newLevel > playerStats.level) {
        addNotification(`Congratulations! You've reached level ${newLevel}!`, 'success');
      }
      loadLeaderboard();
    } catch (error) {
      console.error('Error saving game:', error);
      addNotification('Error saving game results', 'error');
    }
  }

  setCooldownActive(true);
  const cooldownInterval = setInterval(() => {
    setCooldownTime(prevTime => {
      if (prevTime <= 1) {
        clearInterval(cooldownInterval);
        setCooldownActive(false);
        setGameOver(false);
        return 2; // idk what we do here
      }
      return prevTime - 1;
    });
  }, 1000);
};

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!gameActive && !gameOver && !isProfileFocused && !isChatFocused && !cooldownActive) {
      startGame();
    } else if (gameActive) {
      setClicks(prevClicks => prevClicks + 1);
      setLastUpdateTime(Date.now());
    }
  };

  const toggleProfile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowProfile(!showProfile);
    setIsProfileFocused(!showProfile);
  };

  const calculateCPS = () => {
    if (!gameStartTime || !lastUpdateTime || clicks === 0) return '0.00';
  
    const elapsedTime = (Date.now() - gameStartTime) / 1000;
  
    const cps = clicks / elapsedTime;
    return isFinite(cps) ? cps.toFixed(2) : '0.00'; // most lame cps calculation
  };
  
  const averageCPS = playerStats && playerStats.totalGames > 0 
    ? (playerStats.totalClicks / (playerStats.totalGames * gameDuration)).toFixed(2)
    : null;

  const countryFlags = [
    { code: 'TR', emoji: '🇹🇷' },
    { code: 'US', emoji: '🇺🇸' },
    { code: 'GB', emoji: '🇬🇧' },
    { code: 'DE', emoji: '🇩🇪' },
    { code: 'FR', emoji: '🇫🇷' },
  ];

  const ProfileContent = () => {
    const [tempPhotoLink, setTempPhotoLink] = useState<string>('');
    
    // todo: profile picturesss
    // const placeholderImages = [
    // ];

    // const handlePhotoSelect = (photo: string) => {
    //   setProfilePicture(photo);
    // };

    // const handleCustomPhotoSubmit = () => {
    //   if (tempPhotoLink.trim()) {
    //     setProfilePicture(tempPhotoLink);
    //     setTempPhotoLink('');
    //   }
    // };

    if (!playerStats) {
      console.log('something wrong with player stats:', playerStats); // debugging i guess
      return <div>Loading player stats...</div>;
    }

    console.log('rendering profileContent:', playerStats);
    const xpRequiredForNextLevel = getXPRequiredForLevel(playerStats.level);
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <img
            src={profilePicture || "https://t3.ftcdn.net/jpg/06/33/54/78/360_F_633547842_AugYzexTpMJ9z1YcpTKUBoqBF0CUCk10.jpg"} // the IOS profile picture photo, fye
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className={`text-lg font-semibold ${isAdmin ? 'text-red-900' : 'text-gray-900'}`}>
              {isAdmin && '👑 '}{username}
            </h3>
            <p className="text-sm text-gray-700">{countryFlags.find(c => c.code === selectedCountry)?.emoji} {selectedCountry}</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-semibold text-gray-900">Level {playerStats.level}</h3>
            <p className="text-xs text-gray-500">{playerStats.xp} / {xpRequiredForNextLevel} XP</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{width: `${(playerStats.xp / xpRequiredForNextLevel) * 100}%`}}
            ></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Best CPS</span>
            <span className="text-sm font-medium text-gray-900">{playerStats.bestCPS.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Average CPS</span>
            <span className="text-sm font-medium text-gray-900">
              {averageCPS ?? 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Games</span>
            <span className="text-sm font-medium text-gray-900">{playerStats.totalGames}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Clicks</span>
            <span className="text-sm font-medium text-gray-900">{playerStats.totalClicks}</span>
          </div>
        </div>
      </div>
    );
  };

  const RecentGamesContent = () => {
    const [compareWithAverage, setCompareWithAverage] = useState<boolean>(false);
  
    const averageCPS = useMemo(() => {
      return playerStats.totalGames > 0 
        ? playerStats.totalClicks / (playerStats.totalGames * gameDuration)
        : null;
    }, [playerStats.totalGames, playerStats.totalClicks, gameDuration]);
  
    const getColorAndIcon = (cps: number) => {
      if (averageCPS === null) return { color: 'gray', icon: null };
  
      if (cps < averageCPS) {
        return { color: 'red', icon: '🔽' };
      } else if (cps > averageCPS) {
        return { color: 'green', icon: '🔼' };
      } else {
        return { color: 'gray', icon: '➡️' };
      }
    };
  
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="compareWithAverage"
            checked={compareWithAverage}
            onChange={() => setCompareWithAverage(prev => !prev)}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <label
            htmlFor="compareWithAverage"
            className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Compare with average
          </label>
        </div>
        {recentGames.length > 0 ? (
          recentGames.map((game, index) => {
            const { color, icon } = compareWithAverage ? getColorAndIcon(game.cps) : { color: 'gray', icon: null };
            const gameDate = new Date(game.date);
            return (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {gameDate.toLocaleDateString()} {gameDate.toLocaleTimeString()}
                </span>
                <span className={`text-sm font-medium`} style={{ color }}>
                  {game.cps.toFixed(2)} CPS {icon}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-600">No recent games yet. Start playing!</p>
        )}
      </div>
    );
  };
  const SettingsContent = () => (
    <Tabs defaultValue="game" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="game">Game</TabsTrigger>
        <TabsTrigger value="visual">Visual</TabsTrigger>
        <TabsTrigger value="sound">Sound</TabsTrigger>
      </TabsList>
      <TabsContent value="game">
        <div className="space-y-4">
          <div>
            <Label htmlFor="game-duration">Game Duration (seconds)</Label>
            <Slider
              id="game-duration"
              min={5}
              max={60}
              color="blue"
              step={5}
              value={[gameDuration]}
              onValueChange={(value) => setGameDuration(value[0])}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">{gameDuration} seconds</p>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="visual">
      <div className="space-y-4">
        <Label>Visual Effects</Label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'None', level: 0 },
            { name: 'Particles', level: 5 },
            { name: 'Color Shift', level: 10 },
            { name: 'Fireworks', level: 15 },
          ].map((effect) => (
            <motion.div
              key={effect.name}
              className={`p-4 rounded-lg cursor-pointer ${
                selectedVisualEffect === effect.name
                  ? 'bg-green-500 text-white'
                  : playerStats.level >= effect.level
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => playerStats.level >= effect.level && setSelectedVisualEffect(effect.name)}
            >
              <p className="font-medium">{effect.name}</p>
              {playerStats.level < effect.level && (
                <p className="text-xs text-red-500">Unlocks at level {effect.level}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </TabsContent>
    <TabsContent value="sound">
      <div className="space-y-4">
        <Label>Sound Effects</Label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'None', level: 0 },
            { name: 'Click', level: 3 },
            { name: 'Background Music', level: 7 },
            { name: 'Victory Fanfare', level: 12 },
          ].map((effect) => (
            <motion.div
              key={effect.name}
              className={`p-4 rounded-lg cursor-pointer ${
                selectedSoundEffect === effect.name
                  ? 'bg-green-500 text-white'
                  : playerStats.level >= effect.level
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => playerStats.level >= effect.level && setSelectedSoundEffect(effect.name)}
            >
              <p className="font-medium">{effect.name}</p>
              {playerStats.level < effect.level && (
                <p className="text-xs text-red-500">Unlocks at level {effect.level}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </TabsContent>
    </Tabs>
  );

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      if (message.startsWith('/')) {
        const result = executeCommand(message.slice(1), chatCommands, isAdmin);
        if (result) {
          const newMessage = {
            id: Date.now().toString(),
            message: result,
            username: 'System',
            profilePicture: '',
            level: 0,
            isAdmin: true,
          };
          setChatMessages(prev => [...prev, newMessage]);
        }
      } else {
        const newMessage = {
          id: Date.now().toString(),
          message,
          username: getCurrentUsername(),
          profilePicture,
          level: playerStats.level,
          isAdmin: isAdmin && !isDisguised,
        };
        setChatMessages(prev => [...prev, newMessage]);
      }
    }
  };

  const toggleLeaderboard = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowLeaderboard(!showLeaderboard);
  };

  const LeaderboardContent = () => {
    const [sortedLeaderboard, setSortedLeaderboard] = useState<{ username: string; bestCPS: number }[]>([]);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
      const sorted = [...leaderboard].sort((a, b) => b.bestCPS - a.bestCPS);
      setSortedLeaderboard(sorted);
      setTotalPages(Math.ceil(sorted.length / ITEMS_PER_PAGE));
    }, [leaderboard]);

    const paginatedLeaderboard = sortedLeaderboard.slice(
      (leaderboardPage - 1) * ITEMS_PER_PAGE,
      leaderboardPage * ITEMS_PER_PAGE
    );

    const getMedalEmoji = (index: number) => {
      if (index === 0) return '🎖️';
      if (index === 1) return '🥈';
      if (index === 2) return '🥉';
      return '';
    };

    const getNameColor = (index: number) => {
      if (index === 0) return 'text-green-600';
      if (index === 1) return 'text-blue-600';
      if (index === 2) return 'text-orange-600';
      return 'text-gray-800';
    };

    const getNameSize = (index: number) => {
      if (index === 0) return 'text-2xl';
      if (index === 1) return 'text-xl';
      if (index === 2) return 'text-lg';
      return 'text-sm';
    };

    return (
      <div className="space-y-4">
        <ul className="space-y-2">
        {paginatedLeaderboard.map((player, index) => (
          <li 
            key={`${player.username}-${player.bestCPS}-${index}`}
            className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-600 w-6 text-center">
                {getMedalEmoji(index + (leaderboardPage - 1) * ITEMS_PER_PAGE) || 
                 (index + 1 + (leaderboardPage - 1) * ITEMS_PER_PAGE)}
              </span>
              <span className={`font-medium ${getNameColor(index + (leaderboardPage - 1) * ITEMS_PER_PAGE)} ${getNameSize(index + (leaderboardPage - 1) * ITEMS_PER_PAGE)}`}>
                {player.username}
              </span>
            </div>
            <span className="font-semibold text-blue-600 text-sm">
              {`${player.bestCPS.toFixed(2)} CPS`}
            </span>
          </li>
        ))}
      </ul>
        <div className="flex justify-between items-center">
          <button
            onClick={() => setLeaderboardPage(prev => Math.max(1, prev - 1))}
            disabled={leaderboardPage === 1}
            className="p-1 rounded-full bg-gray-100 text-gray-600 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600 font-medium">{leaderboardPage} / {totalPages}</span>
          <button
            onClick={() => setLeaderboardPage(prev => Math.min(totalPages, prev + 1))}
            disabled={leaderboardPage === totalPages}
            className="p-1 rounded-full bg-gray-100 text-gray-600 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const toggleChat = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsChatVisible(!isChatVisible);
  };

  const handleAdminPanelClose = (disguiseInfo?: { isDisguised: boolean; disguisedUsername: string }) => {
    setShowAdminPanel(false);
    if (disguiseInfo) {
      setIsDisguised(disguiseInfo.isDisguised);
      setDisguisedUsername(disguiseInfo.disguisedUsername);
    }
  };

  const getCurrentUsername = () => {
    return isDisguised ? disguisedUsername : username;
  };

  if (showUsernameSelection) {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (isRegistering) {
        handleRegister(e);
      } else {
        handleLogin(e);
      }
    };

    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
        <motion.form
          onSubmit={handleSubmit}
          className="w-80 space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {isRegistering && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          )}
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-sm text-gray-500 text-center"
          >
            Press Enter to {isRegistering ? "register" : "log in"}
          </motion.div>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsRegistering(!isRegistering);
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {isRegistering ? "Switch to login" : "Switch to register"}
          </button>
        </motion.form>
      </div>
    );
  }

  return (
    <div 
    className="flex flex-col items-center justify-center h-screen w-screen bg-gray-100 select-none cursor-pointer relative"
    onClick={handleClick}
    onMouseDown={(e) => e.preventDefault()}
  >
      <div className="absolute top-4 left-4 flex space-x-2">
        <button 
          onClick={toggleLeaderboard}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <BarChart2 size={24} color="#4B5563" />
        </button>
        <button 
          onClick={toggleChat}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <MessageCircle size={24} color="#4B5563" />
        </button>
        {isAdmin && (
          <button 
            onClick={toggleAdminPanel}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Shield size={24} color="#4B5563" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-16 left-4 w-80 bg-white rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg text-gray-500 font-semibold">Leaderboard</h3>
              <motion.button 
                onClick={toggleLeaderboard} 
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>
            <motion.div 
              className="p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <LeaderboardContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!gameActive && (
        <div className="absolute top-4 right-4">
          <button 
            onClick={toggleProfile}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <User size={24} color="#4B5563" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {isChatVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-4 w-80 bg-white rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg text-gray-500 font-semibold">Chat</h3>
              <motion.button 
                onClick={toggleChat} 
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>
            <ChatContainer 
              messages={chatMessages} 
              onSendMessage={handleSendMessage} 
              onFocus={() => setIsChatFocused(true)} 
              onBlur={() => setIsChatFocused(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminPanel && (
          <AdminContainer
            onClose={handleAdminPanelClose}
            playerStats={playerStats}
            setPlayerStats={setPlayerStats}
            username={username}
            setUsername={setUsername}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex space-x-4">
                <motion.button 
                  className={`text-sm font-medium ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('profile')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Profile
                </motion.button>
                <motion.button 
                  className={`text-sm font-medium ${activeTab === 'recentGames' ? 'text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('recentGames')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Recent Games
                </motion.button>
                <motion.button 
                  className={`text-sm font-medium ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('settings')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Settings
                </motion.button>
              </div>
              <motion.button 
                onClick={toggleProfile} 
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>
            <motion.div 
              className="p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && <ProfileContent />}
              {activeTab === 'recentGames' && <RecentGamesContent />}
              {activeTab === 'settings' && <SettingsContent />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing game content */}
      <div className="text-6xl font-extralight text-gray-400 text-center">
        {cooldownActive && justEnteredUsername && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            You can start game in {cooldownTime} seconds...
          </motion.div>
        )}
        {cooldownActive && !justEnteredUsername && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            😢 Next game in {cooldownTime}...
          </motion.div>
        )}
        {!gameActive && !gameOver && !cooldownActive && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Press anywhere to start
          </motion.div>
        )}
        {gameActive && `${calculateCPS()} CPS`}
      </div>

      <PushNotification notifications={notifications} removeNotification={removeNotification} />

    </div>
  );
};

export default CPSGame;