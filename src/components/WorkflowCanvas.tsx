import React, { useMemo } from 'react';
import { 
    StyleSheet, 
    View, 
    Dimensions,
    Image,
    Text,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { 
    Path, 
    G, 
    Defs,
    Pattern,
    Circle,
    Rect as SvgRect
} from 'react-native-svg';
import { 
    Gesture, 
    GestureDetector 
} from 'react-native-gesture-handler';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withTiming,
    Easing
} from 'react-native-reanimated';
import { useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { NodeInspectorSheet } from './NodeInspectorSheet';
import { useN8nStore } from '../store/useN8nStore';
import { getExecutionDetail } from '../api/n8nClient';

interface Node {
    id: string;
    name: string;
    type: string;
    position: [number, number];
}

interface Connection {
    from: string;
    to: string;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 65;
const NODE_RADIUS = 12;

export const WorkflowCanvas: React.FC = () => {
    const route = useRoute<any>();
    const workflow = route.params?.workflow;
    
    const { 
        selectedExecutionErrorId, 
        setSelectedExecutionErrorId,
        executeWorkflow,
        toggleWorkflow,
        executingWorkflows
    } = useN8nStore();
    const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
    const [executionError, setExecutionError] = React.useState<any>(null);

    React.useEffect(() => {
        if (!selectedExecutionErrorId) return;

        let isMounted = true;
        const fetchError = async () => {
            try {
                const detail = await getExecutionDetail(selectedExecutionErrorId);
                const errorData = detail?.data?.resultData?.error;
                
                if (errorData && isMounted) {
                    setExecutionError(errorData);
                    
                    if (errorData.node?.name && workflow?.nodes) {
                        const matchingNode = workflow.nodes.find((n: any) => n.name === errorData.node.name);
                        if (matchingNode) {
                            setSelectedNodeId(matchingNode.id || matchingNode.name);
                        } else {
                            setSelectedNodeId('execution-error-fallback');
                        }
                    } else {
                        setSelectedNodeId('execution-error-fallback');
                    }
                }
            } catch (err) {
                console.warn("Failed to fetch drill-down error", err);
            }
        };

        fetchError();

        return () => { isMounted = false; };
    }, [selectedExecutionErrorId, workflow]);

    const handleCloseSheet = () => {
        setSelectedNodeId(null);
        if (selectedExecutionErrorId) {
            setSelectedExecutionErrorId(null);
            setExecutionError(null);
        }
    };

    const scale = useSharedValue(0.5); 
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    
    const { nodes, connections, bounds } = useMemo(() => {
        if (!workflow || !workflow.nodes) return { 
            nodes: [], 
            connections: [], 
            bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, actualMinX: 0, actualMaxX: 0, actualMinY: 0, actualMaxY: 0 } 
        };

        const nodesList: Node[] = workflow.nodes.map((n: any) => ({
            id: n.id || n.name,
            name: n.name,
            type: n.type,
            position: [
                (n.position?.[0] || 0), 
                (n.position?.[1] || 0)
            ]
        }));

        const connectionsList: Connection[] = [];
        const connObj = workflow.connections || {};

        Object.keys(connObj).forEach(sourceNodeName => {
            const outputs = connObj[sourceNodeName].main || [];
            outputs.forEach((output: any) => {
                output.forEach((target: any) => {
                    connectionsList.push({
                        from: sourceNodeName,
                        to: target.node
                    });
                });
            });
        });

        const xPos = nodesList.map(n => n.position[0]);
        const yPos = nodesList.map(n => n.position[1]);
        
        // Exact Bounding Box of nodes
        const actualMinX = xPos.length ? Math.min(...xPos) : 0;
        const actualMaxX = xPos.length ? Math.max(...xPos) + NODE_WIDTH : NODE_WIDTH;
        const actualMinY = yPos.length ? Math.min(...yPos) : 0;
        const actualMaxY = yPos.length ? Math.max(...yPos) + NODE_HEIGHT : NODE_HEIGHT;

        // Expanded bounds for SVG canvas
        const minX = actualMinX - 800;
        const minY = actualMinY - 800;
        const maxX = actualMaxX + 800;
        const maxY = actualMaxY + 800;

        return { 
            nodes: nodesList, 
            connections: connectionsList, 
            bounds: { minX, minY, maxX, maxY, actualMinX, actualMaxX, actualMinY, actualMaxY } 
        };
    }, [workflow]);

    // Phase 4: Auto-Center Animation Bounding Box
    React.useEffect(() => {
        if (bounds && (bounds.actualMaxX !== bounds.actualMinX)) {
            const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
            
            // Calculate absolute center of the nodes inside the SVG coordinate space
            const nodesCenterXSVG = bounds.actualMinX + (bounds.actualMaxX - bounds.actualMinX) / 2;
            const nodesCenterYSVG = bounds.actualMinY + (bounds.actualMaxY - bounds.actualMinY) / 2;
            
            // Calculate relative offset of node center to the SVG Canvas top-left [bounds.minX, bounds.minY]
            const centerOffsetX = nodesCenterXSVG - bounds.minX;
            const centerOffsetY = nodesCenterYSVG - bounds.minY;

            // Target positioning to center it natively considering scale
            const targetScale = 0.8;
            const finalTranslateX = (screenWidth / 2) - (centerOffsetX * targetScale);
            const finalTranslateY = (screenHeight / 2) - (centerOffsetY * targetScale);
            
            translateX.value = withTiming(finalTranslateX, { duration: 1000, easing: Easing.out(Easing.exp) });
            translateY.value = withTiming(finalTranslateY, { duration: 1000, easing: Easing.out(Easing.exp) });
            scale.value = withTiming(targetScale, { duration: 1000, easing: Easing.out(Easing.exp) });
        }
    }, [bounds]);
    
    // We ONLY need the current absolute values. Tracking start values causes simultaneous gesture fighting.
    // Dimensions cached safely for Math bounds.
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    const panGesture = Gesture.Pan()
        .onChange((event) => {
            const dx = isNaN(event.changeX) ? 0 : event.changeX;
            const dy = isNaN(event.changeY) ? 0 : event.changeY;
            translateX.value += dx;
            translateY.value += dy;
        });

    const lastScale = useSharedValue(1);
    const originX = useSharedValue(0);
    const originY = useSharedValue(0);

    const pinchGesture = Gesture.Pinch()
        .onStart((event) => {
            lastScale.value = 1; // event.scale always starts at 1
            originX.value = isNaN(event.focalX) ? (screenWidth / 2) : event.focalX;
            originY.value = isNaN(event.focalY) ? (screenHeight / 2) : event.focalY;
        })
        .onChange((event) => {
            const safeEventScale = isNaN(event.scale) ? 1 : event.scale;
            
            // Delta scale multiplier over the last frame
            const deltaScale = safeEventScale / lastScale.value;
            lastScale.value = safeEventScale;

            let newScale = scale.value * deltaScale;
            
            // Native Clamping Protection
            if (newScale < 0.1) newScale = 0.1;
            if (newScale > 5.0) newScale = 5.0;

            // Check applied delta in case of clamping limits
            const appliedDeltaScale = newScale / scale.value;
            scale.value = newScale;

            // Mathematical Key: Focal Compensation relative to transform origin (center)
            const focalX = originX.value - (screenWidth / 2);
            const focalY = originY.value - (screenHeight / 2);

            const shiftX = (1 - appliedDeltaScale) * (focalX - translateX.value);
            const shiftY = (1 - appliedDeltaScale) * (focalY - translateY.value);
            
            translateX.value += isNaN(shiftX) ? 0 : shiftX;
            translateY.value += isNaN(shiftY) ? 0 : shiftY;
        });

    const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ]
    }));

    const getNodeColor = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('trigger') || t.includes('webhook') || t.includes('schedule')) return '#00C7B7';
        if (t.includes('n8n-nodes-base.google')) return '#4285F4';
        if (t.includes('postgres')) return '#336791';
        return '#FF6C37'; // Default brand orange
    };

    const getIconUrl = (type: string) => {
        // High fidelity placeholder parsing for nodes via GitHub generic mapping
        return 'https://raw.githubusercontent.com/n8n-io/n8n/master/packages/nodes-base/nodes/Webhook/Webhook.svg';
    };

    const renderConnection = (conn: Connection, index: number) => {
        const sourceNode = nodes.find(n => n.name === conn.from);
        const targetNode = nodes.find(n => n.name === conn.to);

        if (!sourceNode || !targetNode) return null;

        const x1 = sourceNode.position[0] - bounds.minX + NODE_WIDTH + 8;
        const y1 = sourceNode.position[1] - bounds.minY + NODE_HEIGHT / 2;
        const x2 = targetNode.position[0] - bounds.minX - 8;
        const y2 = targetNode.position[1] - bounds.minY + NODE_HEIGHT / 2;

        const cp1x = x1 + Math.abs(x2 - x1) * 0.5;
        const cp2x = x2 - Math.abs(x2 - x1) * 0.5;

        const d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;

        return (
            <Path
                key={`${conn.from}-${conn.to}-${index}`}
                d={d}
                stroke="#4A5568"
                strokeWidth="2.5"
                fill="none"
            />
        );
    };

    const renderNodeNativeUI = (node: Node) => {
        const left = node.position[0] - bounds.minX;
        const top = node.position[1] - bounds.minY;
        const color = getNodeColor(node.type);
        const isSelected = selectedNodeId === node.id || selectedNodeId === node.name;
        
        const isExecutionError = executionError && executionError.node?.name === node.name;

        // Premium Box Shadows and Glow Effects mappings
        const shadowProps = isExecutionError 
            ? { shadowColor: '#EF4444', shadowOpacity: 0.9, shadowRadius: 15, elevation: 15 } // Critical Red Glow
            : isSelected 
            ? { shadowColor: color, shadowOpacity: 0.8, shadowRadius: 12, elevation: 10 }     // Selection Neon Glow
            : { shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 };  // Ambient Shadow

        return (
            <View 
                key={node.id} 
                style={{
                    position: 'absolute',
                    left,
                    top,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    justifyContent: 'center',
                }}
            >
                {/* Visual Connection Socket - INPUT (Native View inside Wrapper) */}
                <View style={[styles.socket, styles.socketLeft, { backgroundColor: color }]} />
                
                {/* Visual Connection Socket - OUTPUT (Native View inside Wrapper) */}
                <View style={[styles.socket, styles.socketRight, { backgroundColor: color }]} />

                {/* Node Main Body Premium Native View */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedNodeId(node.id || node.name);
                    }}
                    style={[
                        styles.nodeCard,
                        { borderColor: isExecutionError ? '#EF4444' : isSelected ? color : '#2D3748' },
                        shadowProps
                    ]}
                >
                    {/* Color Bar Indent Stripe */}
                    <View style={[styles.nodeStripe, { backgroundColor: color }]} />
                    
                    {/* Node Native Icon Image inside SVGs bound Wrapper */}
                    <View style={styles.iconContainer}>
                        {/* Fallback to simple colored letter since dynamic deep parsing depends on package files */}
                        <Text style={[styles.iconFallback, { color }]}>{node.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    
                    {/* Node Texts Native Rendered cleanly */}
                    <View style={styles.textContainer}>
                        <Text style={styles.nodeNameText} numberOfLines={1}>{node.name}</Text>
                        <Text style={styles.nodeTypeText} numberOfLines={1}>
                            {node.type.split('.').pop() || 'Node'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    if (!workflow) return null;

    const viewWidth = bounds.maxX - bounds.minX;
    const viewHeight = bounds.maxY - bounds.minY;

    const isExecuting = executingWorkflows[workflow.id];

    return (
        <View style={styles.container}>
            {/* Contextual Action Bar overlaid securely on screen top */}
            <View style={styles.actionBarContainer}>
                <Text style={styles.actionBarTitle}>Visual</Text>
                
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity 
                        style={styles.actionBtnExecute}
                        onPress={() => executeWorkflow(workflow.id)}
                        disabled={isExecuting}
                    >
                        {isExecuting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                        )}
                        <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Ejecutar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionBtnToggle, { backgroundColor: workflow.active ? '#00C7B7' : '#EF4444' }]}
                        onPress={() => toggleWorkflow(workflow.id, workflow.active)}
                    >
                        <Ionicons name={workflow.active ? 'power' : 'power-outline'} size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <GestureDetector gesture={composedGesture}>
                <Animated.View style={animatedStyle}>
                    <Svg 
                        width={viewWidth} 
                        height={viewHeight}
                        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                        style={{ position: 'absolute' }}
                    >
                        <Defs>
                            <Pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                                <Circle cx="1" cy="1" r="1.5" fill="#2D3748" opacity="0.6" />
                            </Pattern>
                        </Defs>
                        
                        <SvgRect x={0} y={0} width={viewWidth} height={viewHeight} fill="url(#grid)" />
                        
                        {connections.map((c, i) => renderConnection(c, i))}
                    </Svg>
                    
                    {/* Hybrid Embedded Native Views Mapping purely over SVG Grid */}
                    {nodes.map((node) => renderNodeNativeUI(node))}
                </Animated.View>
            </GestureDetector>
            
            <NodeInspectorSheet 
                workflow={workflow}
                selectedNodeId={selectedNodeId}
                executionError={executionError}
                onClose={handleCloseSheet}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
        overflow: 'hidden',
    },
    actionBarContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(26, 28, 38, 0.85)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2D3748',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    actionBarTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionBtnExecute: {
        backgroundColor: '#3182CE',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtnToggle: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
    },
    nodeCard: {
        flex: 1,
        backgroundColor: '#1E202B',
        borderRadius: NODE_RADIUS,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
    },
    nodeStripe: {
        width: 6,
        height: '100%',
        borderTopLeftRadius: NODE_RADIUS,
        borderBottomLeftRadius: NODE_RADIUS,
        marginRight: 10,
    },
    iconContainer: {
        width: 32,
        height: 32,
        backgroundColor: '#2D3748',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    iconFallback: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    nodeNameText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    nodeTypeText: {
        color: '#A0AEC0',
        fontSize: 11,
        fontWeight: '500',
    },
    socket: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#1E202B',
        zIndex: -1,
    },
    socketLeft: {
        left: -7,
        top: NODE_HEIGHT / 2 - 7,
    },
    socketRight: {
        right: -7,
        top: NODE_HEIGHT / 2 - 7,
    }
});
