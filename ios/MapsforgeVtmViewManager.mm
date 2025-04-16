#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "RCTBridge.h"

@interface MapsforgeVtmViewManager : RCTViewManager
@end

@implementation MapsforgeVtmViewManager

RCT_EXPORT_MODULE(MapsforgeVtmView)

- (UIView *)view
{
  return [[UIView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(color, NSString)

@end
