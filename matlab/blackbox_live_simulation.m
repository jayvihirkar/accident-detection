% Smart Vehicle Blackbox and Accident Detection - Live MATLAB Simulation
% This simulation uses the same values produced by the ESP32 firmware:
% ax, ay, az, gx, gy, gz, lat, lng, speed, satellites, impactMagnitude.
%
% Run:
%   blackbox_live_simulation

clear;
clc;
close all;

% ---------------- Demo Location ----------------
demoLat = 18.45968802450589;
demoLng = 73.88479778632185;

% ---------------- Detection Thresholds ----------------
crashThresholdG = 2.0;
potholeThresholdG = 1.8;

% ---------------- Simulation Settings ----------------
sampleCount = 90;
sampleDelaySeconds = 0.12;
data = generateDemoData(sampleCount, demoLat, demoLng);

% ---------------- Figure Layout ----------------
fig = figure( ...
    'Name', 'Smart Vehicle Blackbox Live Simulation', ...
    'Color', [0.94 0.95 0.97], ...
    'NumberTitle', 'off');

layout = tiledlayout(fig, 2, 2, ...
    'TileSpacing', 'compact', ...
    'Padding', 'compact');

% ---------------- GPS Track ----------------
mapAx = nexttile(layout, 1);
hold(mapAx, 'on');
grid(mapAx, 'on');
title(mapAx, 'Vehicle GPS Track');
xlabel(mapAx, 'Longitude');
ylabel(mapAx, 'Latitude');
plot(mapAx, data.lng, data.lat, ':', 'Color', [0.7 0.7 0.7], 'LineWidth', 1);
trackLine = animatedline(mapAx, 'Color', [0.1 0.35 0.85], 'LineWidth', 2);
vehicleMarker = plot(mapAx, data.lng(1), data.lat(1), 'o', ...
    'MarkerFaceColor', [0.1 0.7 0.35], ...
    'MarkerEdgeColor', 'k', ...
    'MarkerSize', 9);
axis(mapAx, [min(data.lng)-0.00015, max(data.lng)+0.00015, ...
             min(data.lat)-0.00015, max(data.lat)+0.00015]);

% ---------------- Acceleration Plot ----------------
accAx = nexttile(layout, 2);
hold(accAx, 'on');
grid(accAx, 'on');
title(accAx, 'MPU6050 Acceleration');
xlabel(accAx, 'Sample');
ylabel(accAx, 'g');
axLine = animatedline(accAx, 'Color', [0.1 0.35 0.85], 'LineWidth', 1.8);
ayLine = animatedline(accAx, 'Color', [0.05 0.6 0.25], 'LineWidth', 1.8);
azLine = animatedline(accAx, 'Color', [0.85 0.1 0.1], 'LineWidth', 1.8);
yline(accAx, crashThresholdG, '--r', 'Crash threshold');
legend(accAx, {'ax', 'ay', 'az'}, 'Location', 'northwest');
ylim(accAx, [-2.5 4.5]);

% ---------------- Gyroscope Plot ----------------
gyroAx = nexttile(layout, 3);
hold(gyroAx, 'on');
grid(gyroAx, 'on');
title(gyroAx, 'MPU6050 Gyroscope');
xlabel(gyroAx, 'Sample');
ylabel(gyroAx, 'degree/s');
gxLine = animatedline(gyroAx, 'Color', [0.45 0.2 0.85], 'LineWidth', 1.8);
gyLine = animatedline(gyroAx, 'Color', [0.9 0.55 0.05], 'LineWidth', 1.8);
gzLine = animatedline(gyroAx, 'Color', [0.0 0.55 0.65], 'LineWidth', 1.8);
legend(gyroAx, {'gx', 'gy', 'gz'}, 'Location', 'northwest');
ylim(gyroAx, [-8 9]);

% ---------------- Status Panel ----------------
statusAx = nexttile(layout, 4);
axis(statusAx, 'off');
title(statusAx, 'Live Blackbox Status');
statusText = text(statusAx, 0.05, 0.86, '', 'FontSize', 20, 'FontWeight', 'bold');
speedText = text(statusAx, 0.05, 0.70, '', 'FontSize', 13);
gpsText = text(statusAx, 0.05, 0.58, '', 'FontSize', 11);
sensorText = text(statusAx, 0.05, 0.42, '', 'FontSize', 11);
eventText = text(statusAx, 0.05, 0.20, '', 'FontSize', 14, 'FontWeight', 'bold');

% ---------------- Live Simulation Loop ----------------
for i = 1:sampleCount
    row = data(i, :);

    status = "SAFE";
    severity = "NONE";
    eventMessage = "Normal driving";
    markerColor = [0.1 0.7 0.35];
    statusColor = [0.0 0.45 0.2];

    if row.impactMagnitude > crashThresholdG
        status = "CRASH";
        severity = classifySeverity(row.impactMagnitude);
        eventMessage = "CRASH DETECTED - emergency alert";
        markerColor = [0.9 0.05 0.05];
        statusColor = [0.75 0.05 0.05];
    elseif abs(row.az) > potholeThresholdG
        status = "SAFE";
        severity = "LOW";
        eventMessage = "POTHOLE / ROAD SHOCK DETECTED";
        markerColor = [0.95 0.6 0.05];
        statusColor = [0.75 0.4 0.0];
    elseif abs(row.ax) > 0.8 || abs(row.ay) > 0.8
        status = "SAFE";
        severity = "NONE";
        eventMessage = "Vehicle tilt / hard braking";
        markerColor = [0.95 0.6 0.05];
        statusColor = [0.75 0.4 0.0];
    end

    addpoints(trackLine, row.lng, row.lat);
    set(vehicleMarker, 'XData', row.lng, 'YData', row.lat, 'MarkerFaceColor', markerColor);

    addpoints(axLine, i, row.ax);
    addpoints(ayLine, i, row.ay);
    addpoints(azLine, i, row.az);

    addpoints(gxLine, i, row.gx);
    addpoints(gyLine, i, row.gy);
    addpoints(gzLine, i, row.gz);

    set(statusText, 'String', sprintf('%s  |  Severity: %s', status, severity), 'Color', statusColor);
    set(speedText, 'String', sprintf('Speed: %.1f km/h     Satellites: %d', row.speed, row.satellites));
    set(gpsText, 'String', sprintf('GPS: %.6f, %.6f', row.lat, row.lng));
    set(sensorText, 'String', sprintf( ...
        'Impact: %.2f g\nax %.2f | ay %.2f | az %.2f\ngx %.2f | gy %.2f | gz %.2f', ...
        row.impactMagnitude, row.ax, row.ay, row.az, row.gx, row.gy, row.gz));
    set(eventText, 'String', eventMessage, 'Color', statusColor);

    drawnow;
    pause(sampleDelaySeconds);
end

disp('Simulation complete.');

% ---------------- Local Functions ----------------
function data = generateDemoData(sampleCount, baseLat, baseLng)
    t = (1:sampleCount)';

    lat = baseLat + linspace(-0.00035, 0.00035, sampleCount)' + 0.00004 * sin(t / 8);
    lng = baseLng + linspace(-0.00045, 0.00045, sampleCount)' + 0.00004 * cos(t / 9);

    speed = 28 + 10 * sin(t / 12);
    satellites = 8 + mod(t, 3);

    ax = 0.04 * sin(t / 5);
    ay = 0.04 * cos(t / 6);
    az = 1.0 + 0.04 * sin(t / 7);

    gx = 0.4 * sin(t / 5);
    gy = 0.3 * cos(t / 6);
    gz = 0.25 * sin(t / 4);

    % Hard braking section.
    brakeIndex = 34:42;
    ax(brakeIndex) = ax(brakeIndex) - linspace(0.35, 0.95, numel(brakeIndex))';
    gy(brakeIndex) = gy(brakeIndex) + linspace(0.3, 1.2, numel(brakeIndex))';
    speed(brakeIndex) = speed(brakeIndex) - linspace(2, 12, numel(brakeIndex))';

    % Pothole / road shock section.
    potholeIndex = 55:58;
    az(potholeIndex) = [1.45; 1.92; 1.74; 1.20];
    gx(potholeIndex) = [1.2; 2.1; 1.7; 0.8];
    gz(potholeIndex) = [0.7; 1.1; 0.8; 0.4];

    % Crash section.
    crashIndex = 72:76;
    ax(crashIndex) = [0.8; 2.4; 3.2; 1.6; 0.7];
    ay(crashIndex) = [-0.4; -1.1; -1.5; -0.8; -0.2];
    az(crashIndex) = [1.4; 2.8; 3.5; 2.0; 1.2];
    gx(crashIndex) = [2.2; 5.6; 7.4; 4.0; 1.5];
    gy(crashIndex) = [1.0; 2.8; 3.6; 1.7; 0.6];
    gz(crashIndex) = [1.6; 4.4; 6.1; 3.2; 1.0];
    speed(crashIndex) = [42; 39; 28; 12; 0];

    impactMagnitude = sqrt(ax.^2 + ay.^2 + az.^2);
    timestamp = posixtime(datetime('now')) + t;

    data = table( ...
        timestamp, lat, lng, speed, satellites, ...
        ax, ay, az, gx, gy, gz, impactMagnitude);
end

function severity = classifySeverity(impactMagnitude)
    if impactMagnitude >= 3.5
        severity = "HIGH";
    elseif impactMagnitude >= 2.0
        severity = "MEDIUM";
    else
        severity = "LOW";
    end
end
