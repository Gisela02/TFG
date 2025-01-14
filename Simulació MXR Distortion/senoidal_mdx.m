clear all;

f=3000;
w=2*pi*f;
fs=44100;
Ts=1/fs;
t_sim = 3.3e-3;
t=0:Ts:t_sim-Ts;
vi=0.01*sin(w*t);
tolerancce=1e-5;
n_iter=100;

% Estat variables en estèreo
%Xc4=0; Xc5=0;
Xc4=[0;0] ; Xc5=Xc4; xc2=Xc4; xc3 = Xc4; xc6 = Xc4;

% Wippers
wipper_out=1;
wipper_distortion = 0;

[vout,vo1,xc2,xc3,Xc4,Xc5,xc6] = mxr_distortion([vi;vi],Ts,wipper_out,wipper_distortion,xc2,xc3,Xc4,Xc5,xc6);
plot(t,vi,t,vo1(1,:),'r',t,vout(1,:),'g');
figure(2);
plot(t,vi,t,vo1(2,:),'r',t,vout(2,:),'g');