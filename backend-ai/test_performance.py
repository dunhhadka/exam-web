"""
Performance Benchmark Suite
Comprehensive testing of system performance metrics
"""

import sys
import os
import asyncio
import time
import statistics
import json
from typing import List, Dict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_analysis.integration_helper import get_or_create_real_analyzer
from ai_analysis.frame_capture import create_mock_frame_capture


class PerformanceBenchmark:
    """Performance benchmark runner"""
    
    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock
        self.analyzer = None
        self.capturer = None
        self.results = {}
    
    async def setup(self):
        """Setup benchmark environment"""
        print("\n🔧 Setting up benchmark environment...")
        
        start = time.time()
        self.analyzer = await get_or_create_real_analyzer(use_mock=self.use_mock)
        setup_time = (time.time() - start) * 1000
        
        self.capturer = create_mock_frame_capture()
        
        print(f"✅ Setup complete in {setup_time:.1f}ms")
        print(f"  Use mock models: {self.use_mock}")
        print(f"  Device: {self.analyzer.device}")
        print("")
    
    async def benchmark_frame_capture(self, iterations: int = 100):
        """Benchmark frame capture performance"""
        print(f"\n[BENCHMARK] Frame Capture ({iterations} iterations)")
        print("-" * 50)
        
        times = []
        
        for _ in range(iterations):
            start = time.time()
            
            frame_data = await self.capturer.capture_all(None, None, None)
            
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)
        
        self.results['frame_capture'] = {
            'iterations': iterations,
            'min': min(times),
            'max': max(times),
            'mean': statistics.mean(times),
            'median': statistics.median(times),
            'stdev': statistics.stdev(times) if len(times) > 1 else 0,
            'p95': sorted(times)[int(iterations * 0.95)],
            'p99': sorted(times)[int(iterations * 0.99)]
        }
        
        self._print_stats('Frame Capture', self.results['frame_capture'])
    
    async def benchmark_single_model_inference(self, iterations: int = 100):
        """Benchmark individual model inference times"""
        print(f"\n[BENCHMARK] Single Model Inference ({iterations} iterations)")
        print("-" * 50)
        
        # Create test data
        frame_data = await self.capturer.capture_all(None, None, None)
        
        # Test each analysis type separately
        times_by_type = {}
        
        for _ in range(iterations):
            result = await self.analyzer.analyze_frame(
                candidate_id="benchmark",
                room_id="test",
                frame_data=frame_data
            )
            
            for analysis in result.get('analyses', []):
                analysis_type = analysis['type']
                
                if analysis_type not in times_by_type:
                    times_by_type[analysis_type] = []
                
                # Mock doesn't have individual timing, so we use overall
                # In real scenario, each model has its own timing
                # For now, use overall / 5 as approximation
                approx_time = result.get('processing_time_ms', 0) / 5
                times_by_type[analysis_type].append(approx_time)
        
        self.results['single_model'] = {}
        
        for analysis_type, times in times_by_type.items():
            self.results['single_model'][analysis_type] = {
                'iterations': len(times),
                'min': min(times),
                'max': max(times),
                'mean': statistics.mean(times),
                'median': statistics.median(times)
            }
            
            print(f"\n  {analysis_type}:")
            print(f"    Mean: {statistics.mean(times):.2f}ms")
            print(f"    Median: {statistics.median(times):.2f}ms")
    
    async def benchmark_full_pipeline(self, iterations: int = 100):
        """Benchmark complete analysis pipeline"""
        print(f"\n[BENCHMARK] Full Pipeline ({iterations} iterations)")
        print("-" * 50)
        
        times = []
        
        for i in range(iterations):
            # Capture frames
            frame_data = await self.capturer.capture_all(None, None, None)
            
            # Analyze
            start = time.time()
            
            result = await self.analyzer.analyze_frame(
                candidate_id=f"bench_{i}",
                room_id="test",
                frame_data=frame_data
            )
            
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)
        
        self.results['full_pipeline'] = {
            'iterations': iterations,
            'min': min(times),
            'max': max(times),
            'mean': statistics.mean(times),
            'median': statistics.median(times),
            'stdev': statistics.stdev(times) if len(times) > 1 else 0,
            'p95': sorted(times)[int(iterations * 0.95)],
            'p99': sorted(times)[int(iterations * 0.99)]
        }
        
        self._print_stats('Full Pipeline', self.results['full_pipeline'])
    
    async def benchmark_throughput(self, duration_seconds: int = 10):
        """Benchmark system throughput (frames per second)"""
        print(f"\n[BENCHMARK] Throughput ({duration_seconds}s test)")
        print("-" * 50)
        
        start_time = time.time()
        frame_count = 0
        
        while (time.time() - start_time) < duration_seconds:
            frame_data = await self.capturer.capture_all(None, None, None)
            
            await self.analyzer.analyze_frame(
                candidate_id="throughput_test",
                room_id="test",
                frame_data=frame_data
            )
            
            frame_count += 1
        
        elapsed = time.time() - start_time
        fps = frame_count / elapsed
        
        self.results['throughput'] = {
            'duration_seconds': elapsed,
            'total_frames': frame_count,
            'fps': fps,
            'ms_per_frame': 1000 / fps
        }
        
        print(f"\n  Duration: {elapsed:.2f}s")
        print(f"  Total frames: {frame_count}")
        print(f"  Throughput: {fps:.2f} FPS")
        print(f"  Time per frame: {1000/fps:.2f}ms")
    
    async def benchmark_concurrent_load(self, num_candidates: int = 5, frames_per_candidate: int = 10):
        """Benchmark concurrent candidate processing"""
        print(f"\n[BENCHMARK] Concurrent Load ({num_candidates} candidates, {frames_per_candidate} frames each)")
        print("-" * 50)
        
        async def process_candidate(candidate_id: str):
            times = []
            
            for i in range(frames_per_candidate):
                frame_data = await self.capturer.capture_all(None, None, None)
                
                start = time.time()
                
                await self.analyzer.analyze_frame(
                    candidate_id=candidate_id,
                    room_id="test",
                    frame_data=frame_data
                )
                
                elapsed = (time.time() - start) * 1000
                times.append(elapsed)
                
                await asyncio.sleep(0.5)  # 2 FPS
            
            return times
        
        start_time = time.time()
        
        tasks = [
            process_candidate(f"candidate_{i}")
            for i in range(num_candidates)
        ]
        
        all_times = await asyncio.gather(*tasks)
        
        total_elapsed = (time.time() - start_time) * 1000
        
        # Flatten times
        flat_times = [t for times in all_times for t in times]
        
        self.results['concurrent_load'] = {
            'num_candidates': num_candidates,
            'frames_per_candidate': frames_per_candidate,
            'total_frames': len(flat_times),
            'total_time_ms': total_elapsed,
            'mean': statistics.mean(flat_times),
            'median': statistics.median(flat_times),
            'p95': sorted(flat_times)[int(len(flat_times) * 0.95)],
            'p99': sorted(flat_times)[int(len(flat_times) * 0.99)]
        }
        
        print(f"\n  Total time: {total_elapsed:.1f}ms")
        print(f"  Total frames: {len(flat_times)}")
        print(f"  Mean latency: {statistics.mean(flat_times):.2f}ms")
        print(f"  Median latency: {statistics.median(flat_times):.2f}ms")
        print(f"  P95 latency: {self.results['concurrent_load']['p95']:.2f}ms")
        print(f"  P99 latency: {self.results['concurrent_load']['p99']:.2f}ms")
    
    async def benchmark_memory_usage(self):
        """Benchmark memory usage (if psutil available)"""
        print(f"\n[BENCHMARK] Memory Usage")
        print("-" * 50)
        
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            
            # Get current memory
            mem_info = process.memory_info()
            mem_mb = mem_info.rss / (1024 * 1024)
            
            print(f"\n  Process memory: {mem_mb:.2f} MB")
            
            # Check GPU memory if available
            try:
                import torch
                if torch.cuda.is_available():
                    gpu_mem = torch.cuda.memory_allocated() / (1024 * 1024)
                    gpu_mem_reserved = torch.cuda.memory_reserved() / (1024 * 1024)
                    
                    print(f"  GPU memory allocated: {gpu_mem:.2f} MB")
                    print(f"  GPU memory reserved: {gpu_mem_reserved:.2f} MB")
                    
                    self.results['memory'] = {
                        'process_mb': mem_mb,
                        'gpu_allocated_mb': gpu_mem,
                        'gpu_reserved_mb': gpu_mem_reserved
                    }
                else:
                    print(f"  GPU: Not available")
                    self.results['memory'] = {
                        'process_mb': mem_mb,
                        'gpu_available': False
                    }
            except ImportError:
                print(f"  GPU: PyTorch not available")
                self.results['memory'] = {
                    'process_mb': mem_mb,
                    'gpu_available': False
                }
        
        except ImportError:
            print("  ⚠️  psutil not available - skipping memory test")
            self.results['memory'] = {'error': 'psutil not available'}
    
    def _print_stats(self, name: str, stats: Dict):
        """Print statistics in nice format"""
        print(f"\n  {name}:")
        print(f"    Iterations: {stats['iterations']}")
        print(f"    Min: {stats['min']:.2f}ms")
        print(f"    Max: {stats['max']:.2f}ms")
        print(f"    Mean: {stats['mean']:.2f}ms")
        print(f"    Median: {stats['median']:.2f}ms")
        if 'stdev' in stats:
            print(f"    StdDev: {stats['stdev']:.2f}ms")
        if 'p95' in stats:
            print(f"    P95: {stats['p95']:.2f}ms")
        if 'p99' in stats:
            print(f"    P99: {stats['p99']:.2f}ms")
    
    def generate_report(self):
        """Generate performance report"""
        print("\n" + "=" * 50)
        print("PERFORMANCE REPORT")
        print("=" * 50)
        
        print(f"\n📊 Summary:")
        print(f"  Configuration: {'Mock Models' if self.use_mock else 'Real Models'}")
        print(f"  Device: {self.analyzer.device}")
        
        # Frame Capture
        if 'frame_capture' in self.results:
            fc = self.results['frame_capture']
            print(f"\n  Frame Capture:")
            print(f"    Mean: {fc['mean']:.2f}ms")
            print(f"    P95: {fc['p95']:.2f}ms")
        
        # Full Pipeline
        if 'full_pipeline' in self.results:
            fp = self.results['full_pipeline']
            print(f"\n  Full Pipeline:")
            print(f"    Mean: {fp['mean']:.2f}ms")
            print(f"    P95: {fp['p95']:.2f}ms")
            print(f"    P99: {fp['p99']:.2f}ms")
        
        # Throughput
        if 'throughput' in self.results:
            tp = self.results['throughput']
            print(f"\n  Throughput:")
            print(f"    {tp['fps']:.2f} FPS")
            print(f"    {tp['ms_per_frame']:.2f}ms per frame")
        
        # Concurrent Load
        if 'concurrent_load' in self.results:
            cl = self.results['concurrent_load']
            print(f"\n  Concurrent Load ({cl['num_candidates']} candidates):")
            print(f"    Mean latency: {cl['mean']:.2f}ms")
            print(f"    P95 latency: {cl['p95']:.2f}ms")
        
        # Memory
        if 'memory' in self.results and 'process_mb' in self.results['memory']:
            mem = self.results['memory']
            print(f"\n  Memory Usage:")
            print(f"    Process: {mem['process_mb']:.2f} MB")
            if 'gpu_allocated_mb' in mem:
                print(f"    GPU: {mem['gpu_allocated_mb']:.2f} MB")
        
        # Performance targets
        print(f"\n🎯 Performance Targets:")
        print(f"  Frame Capture: <100ms")
        
        if 'frame_capture' in self.results:
            status = "✅" if self.results['frame_capture']['mean'] < 100 else "❌"
            print(f"    Status: {status} ({self.results['frame_capture']['mean']:.2f}ms)")
        
        print(f"\n  Full Pipeline: <1500ms")
        
        if 'full_pipeline' in self.results:
            status = "✅" if self.results['full_pipeline']['mean'] < 1500 else "❌"
            print(f"    Status: {status} ({self.results['full_pipeline']['mean']:.2f}ms)")
        
        print(f"\n  Throughput: >1 FPS")
        
        if 'throughput' in self.results:
            status = "✅" if self.results['throughput']['fps'] > 1 else "❌"
            print(f"    Status: {status} ({self.results['throughput']['fps']:.2f} FPS)")
        
        # Save results to file
        with open('benchmark_results.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n💾 Results saved to: benchmark_results.json")


async def main():
    """Run performance benchmark suite"""
    print("=" * 50)
    print("PERFORMANCE BENCHMARK SUITE")
    print("=" * 50)
    
    bench = PerformanceBenchmark(use_mock=True)
    
    try:
        # Setup
        await bench.setup()
        
        # Run benchmarks
        await bench.benchmark_frame_capture(iterations=100)
        await bench.benchmark_single_model_inference(iterations=100)
        await bench.benchmark_full_pipeline(iterations=100)
        await bench.benchmark_throughput(duration_seconds=10)
        await bench.benchmark_concurrent_load(num_candidates=5, frames_per_candidate=10)
        await bench.benchmark_memory_usage()
        
        # Generate report
        bench.generate_report()
        
        print("\n" + "=" * 50)
        print("✅ BENCHMARK COMPLETE")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ BENCHMARK FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
