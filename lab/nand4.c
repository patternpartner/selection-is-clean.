// lab/nand4.c - #338: exact NAND grading of all 65,536 four-input boolean functions (16-bit truth tables; row k = x1x2x3x4,
// x1=0xFF00 x2=0xF0F0 x3=0xCCCC x4=0xAAAA; no constants). Writes lab/nand4-sz.bin and lab/nand4-csz.bin, one byte per function.
//  SZ:  exact NAND FORMULA size (a tree: NAND(x,y) costs size x + size y + 1), level by level, so the first size found is the least.
//  CSZ: exact NAND CIRCUIT size (gates may be shared) for every function some circuit of at most K gates computes, by
//       exhaustive search over canonical gate sequences: gate t+1 either reads gate t or has a larger (i,j) pair than gate t
//       (any circuit can be reordered into that form by swapping adjacent independent gates), and no gate repeats a wire.
//       A function not reached by K gates is stored as K+1 and means AT LEAST K+1.
//   gcc -O3 -o /tmp/nand4 lab/nand4.c && /tmp/nand4 K
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
static uint8_t SZ[65536], CSZ[65536]; static int K;
static uint16_t W[32]; static int NW;
static long long nodes=0;
static void dfs(int t,int pi,int pj){   // t gates placed; (pi,pj) the last gate's pair
  if(t==K) return;
  int last=NW-1;
  for(int i=0;i<NW;i++) for(int j=i;j<NW;j++){
    if(t>0 && !(i==last||j==last) && (i<pi||(i==pi&&j<=pj))) continue;
    uint16_t z=(uint16_t)~(W[i]&W[j]); int dup=0; for(int q=0;q<NW;q++) if(W[q]==z){dup=1;break;} if(dup) continue;
    nodes++; if(CSZ[z]>t+1) CSZ[z]=t+1;
    W[NW++]=z; dfs(t+1,i,j); NW--; }
}
int main(int argc,char**argv){
  K=argc>1?atoi(argv[1]):7;
  // formula size by levels
  memset(SZ,255,sizeof SZ); static uint16_t lv[64][65536]; static int ln[64]; int found=0;
  uint16_t in[4]={0xFF00,0xF0F0,0xCCCC,0xAAAA}; for(int k=0;k<4;k++){ SZ[in[k]]=0; lv[0][ln[0]++]=in[k]; found++; }
  for(int s=1;s<64&&found<65536;s++){ for(int a=0;a<=(s-1)/2;a++){ int b=s-1-a;
      for(int x=0;x<ln[a];x++) for(int y=(a==b?x:0);y<ln[b];y++){ uint16_t z=(uint16_t)~(lv[a][x]&lv[b][y]); if(SZ[z]==255){ SZ[z]=s; lv[s][ln[s]++]=z; found++; } } }
    fprintf(stderr,"formula size %d: %d functions (total %d)\n",s,ln[s],found); }
  // circuit size
  memset(CSZ,K+1,sizeof CSZ); for(int k=0;k<4;k++){ CSZ[in[k]]=0; W[k]=in[k]; } NW=4;
  dfs(0,-1,-1);
  int hist[32]={0}; for(int f=0;f<65536;f++) hist[CSZ[f]]++;
  fprintf(stderr,"circuit search K=%d nodes %lld\n",K,nodes); for(int s=0;s<=K+1;s++) fprintf(stderr,"circuit %s%d: %d\n",s==K+1?">=":"",s,hist[s]);
  FILE*f=fopen("lab/nand4-sz.bin","wb"); fwrite(SZ,1,65536,f); fclose(f); f=fopen("lab/nand4-csz.bin","wb"); fwrite(CSZ,1,65536,f); fclose(f);
  return 0; }
