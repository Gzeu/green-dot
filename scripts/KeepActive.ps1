param(
    [int]$IntervalMinutes = 4,
    [switch]$Adaptive = $true,
    [switch]$BurstMode = $true,
    [switch]$CheckIdle = $true,
    [switch]$LowPriority = $true
)

# Set low priority if requested
if ($LowPriority) {
    $process = Get-Process -Id $PID
    $process.PriorityClass = 'BelowNormal'
}

Add-Type @'
    using System;
    using System.Runtime.InteropServices;
    
    public class UserActivity {
        [DllImport("user32.dll")]
        public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
        
        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
        
        public struct LASTINPUTINFO {
            public uint cbSize;
            public uint dwTime;
        }
        
        public static uint GetIdleTime() {
            LASTINPUTINFO lastInputInfo = new LASTINPUTINFO();
            lastInputInfo.cbSize = (uint)Marshal.SizeOf(lastInputInfo);
            GetLastInputInfo(ref lastInputInfo);
            return ((uint)Environment.TickCount - lastInputInfo.dwTime);
        }
        
        public static void SendKey(byte keyCode) {
            const uint KEYEVENTF_KEYUP = 0x0002;
            keybd_event(keyCode, 0, 0, UIntPtr.Zero);
            System.Threading.Thread.Sleep(50);
            keybd_event(keyCode, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        }
    }
'@

# Key codes for F13, F14, F15, and Shift
$Keys = @{
    F13 = 0x7C
    F14 = 0x7D
    F15 = 0x7E
    Shift = 0x10
}

$KeyNames = @('F13', 'F14', 'F15', 'Shift')
$CurrentKeyIndex = 0

function Get-RandomInterval {
    param([int]$BaseMinutes)
    
    if ($Adaptive) {
        # AI-inspired adaptive timing
        $variance = [Math]::Floor($BaseMinutes * 0.3)
        $min = [Math]::Max(1, $BaseMinutes - $variance)
        $max = $BaseMinutes + $variance
        return Get-Random -Minimum $min -Maximum ($max + 1)
    }
    return $BaseMinutes
}

function Send-KeyPress {
    param([string]$KeyName)
    
    $keyCode = $Keys[$KeyName]
    [UserActivity]::SendKey($keyCode)
    
    if ($BurstMode -and (Get-Random -Minimum 0 -Maximum 100) -lt 20) {
        # 20% chance of burst (2-4 rapid presses)
        $burstCount = Get-Random -Minimum 2 -Maximum 5
        for ($i = 0; $i -lt $burstCount; $i++) {
            Start-Sleep -Milliseconds (Get-Random -Minimum 100 -Maximum 300)
            [UserActivity]::SendKey($keyCode)
        }
    }
}

function Get-UserIdleSeconds {
    return [Math]::Floor([UserActivity]::GetIdleTime() / 1000)
}

function Clear-PSHistory {
    # Anti-forensics: Clear PowerShell history
    try {
        Clear-History -ErrorAction SilentlyContinue
        Remove-Item (Get-PSReadlineOption).HistorySavePath -ErrorAction SilentlyContinue
    } catch {
        # Silently ignore errors
    }
}

Write-Host "🟢 Green Dot Active" -ForegroundColor Green
Write-Host "Interval: $IntervalMinutes minutes" -ForegroundColor Gray
Write-Host "Mode: $(if($Adaptive){'AI Adaptive'}else{'Standard'})" -ForegroundColor Gray
Write-Host "Features: $(if($BurstMode){'⚡Burst '})$(if($CheckIdle){'👤Idle '})$(if($LowPriority){'🔇Stealth'})" -ForegroundColor Gray
Write-Host ""

$iteration = 0

while ($true) {
    $iteration++
    
    # Check if user is idle (> 2 minutes)
    $idleSeconds = Get-UserIdleSeconds
    
    if (-not $CheckIdle -or $idleSeconds -gt 120) {
        # Rotate key method
        $currentKey = $KeyNames[$CurrentKeyIndex]
        $CurrentKeyIndex = ($CurrentKeyIndex + 1) % $KeyNames.Count
        
        Send-KeyPress -KeyName $currentKey
        
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] 🟢 Keep-alive sent (Method: $currentKey)" -ForegroundColor Green
        
        # Anti-forensics
        if ($iteration % 10 -eq 0) {
            Clear-PSHistory
        }
    } else {
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] ⏸️  User active, skipping..." -ForegroundColor Yellow
    }
    
    # Calculate next interval
    $nextInterval = Get-RandomInterval -BaseMinutes $IntervalMinutes
    $sleepSeconds = $nextInterval * 60
    
    Write-Host "Next check in $nextInterval minutes" -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep -Seconds $sleepSeconds
}